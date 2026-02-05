import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes } from "./auth";
import { z } from "zod";
import { wsManager } from "./websocket";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Set up AI
  const { registerAIRoutes } = await import("./ai");
  await registerAIRoutes(app);

  // Set up Games
  const { registerGameRoutes } = await import("./games");
  await registerGameRoutes(app);

  // Set up Admin
  const { registerAdminRoutes } = await import("./admin");
  await registerAdminRoutes(app);

  /**
   * INTIMA MIDDLEWARES
   */
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && (req.user as any).role === 'admin') {
      return next();
    }
    res.status(403).json({ message: "Forbidden: Admin access required" });
  };

  /**
   * AUTH & LEGAL
   */
  app.post(api.auth.verifyAge.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    await storage.verifyAge(userId);
    res.json({ success: true });
  });

  /**
   * COMMUNITY (Section A)
   */
  app.get("/api/community/rooms", async (req, res) => {
    const rooms = await storage.listCommunityRooms();
    res.json(rooms);
  });

  app.get("/api/community/rooms/:roomId/messages", async (req, res) => {
    const messages = await storage.getCommunityMessages(Number(req.params.roomId));
    res.json(messages);
  });

  app.post("/api/community/rooms/:roomId/messages", requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const msg = await storage.createCommunityMessage(Number(req.params.roomId), userId, req.body.content);
    wsManager.broadcastToRoom(`community:${req.params.roomId}`, 'community_message', msg);
    res.status(201).json(msg);
  });

  /**
   * RELATIONSHIP HEALTH (Section G)
   */
  app.get("/api/couples/:coupleId/health", requireAuth, async (req, res) => {
    const health = await storage.getRelationshipHealth(Number(req.params.coupleId));
    res.json(health);
  });

  /**
   * PROFILES
   */
  app.get(api.profiles.list.path, async (req, res) => {
    const profiles = await storage.listPublicProfiles();
    res.json(profiles);
  });

  app.get(api.profiles.get.path, async (req, res) => {
    const profile = await storage.getProfile(req.params.userId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  });

  app.get(api.profiles.getByUser.path, async (req, res) => {
    const profile = await storage.getProfile(req.params.userId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  });

  app.post("/api/profiles/:userId/like", requireAuth, async (req, res) => {
    const fromUserId = (req.user as any).id;
    const toUserId = req.params.userId;
    const isMatch = await storage.recordLike(fromUserId, toUserId);
    res.json({ isMatch });
  });

  app.get("/api/matches", requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const matches = await storage.getMatches(userId);
    res.json(matches);
  });

  app.put(api.profiles.update.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const input = api.profiles.update.input!.parse(req.body);
      const profile = await storage.updateProfile(userId, input as any);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/users/me", requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const { firstName, lastName, profileImageUrl } = req.body;
    const updatedUser = await storage.updateUser(userId, { firstName, lastName, profileImageUrl });
    res.json(updatedUser);
  });

  /**
   * PREFERENCES (Section D - Sex Styles & Boundaries)
   */
  app.get("/api/preferences", requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const prefs = await storage.getUserPreferences(userId);
    res.json(prefs || {});
  });

  app.patch("/api/preferences", requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const prefs = await storage.updateUserPreferences(userId, req.body);
    res.json(prefs);
  });

  /**
   * COUPLES
   */
  app.get(api.couples.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const couples = await storage.getCouplesForUser(userId);
    res.json(couples);
  });

  app.post("/api/couples/pair", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { inviteCode } = req.body;
      const couple = await storage.pairByInviteCode(userId, inviteCode);
      res.json(couple);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/gifts/send", requireAuth, async (req, res) => {
    try {
      const fromUserId = (req.user as any).id;
      const { toUserId, giftType, amount } = req.body;
      const gift = await storage.sendGift(fromUserId, toUserId, giftType, amount);
      res.json(gift);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post(api.couples.create.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const { partnerId } = api.couples.create.input.parse(req.body);
    const couple = await storage.createCouple(userId, String(partnerId));
    res.status(201).json(couple);
  });

  /**
   * MESSAGING
   */
  app.get(api.messages.list.path, requireAuth, async (req, res) => {
    const coupleId = Number(req.params.coupleId);
    const messages = await storage.getMessages(coupleId);
    res.json(messages);
  });

  app.post(api.messages.send.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const coupleId = Number(req.params.coupleId);
    const { content, type } = api.messages.send.input.parse(req.body);
    const message = await storage.createMessage(coupleId, userId, content, type);
    wsManager.broadcastToRoom(`couple:${coupleId}`, 'new_message', message);
    res.status(201).json(message);
  });

  /**
   * MEMORIES (Section K)
   */
  app.get("/api/couples/:coupleId/memories", requireAuth, async (req, res) => {
    const memories = await storage.getMemories(Number(req.params.coupleId));
    res.json(memories);
  });

  app.post("/api/couples/:coupleId/memories", requireAuth, async (req, res) => {
    const memory = await storage.createMemory(Number(req.params.coupleId), req.body);
    res.status(201).json(memory);
  });

  /**
   * HEALTH & CYCLE
   */
  app.get(api.cycle.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const logs = await storage.getCycleLogs(userId);
    res.json(logs);
  });

  app.post(api.cycle.log.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const input = api.cycle.log.input.parse(req.body);
    const log = await storage.createCycleLog({ ...input, userId });
    res.status(201).json(log);
  });

  /**
   * WALLET & ECONOMY
   */
  app.get(api.wallet.get.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const balance = await storage.getWalletBalance(userId);
    res.json({ balance, transactions: [] });
  });

  app.post("/api/withdrawals", requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const { amount, paymentMethod, paymentDetails } = req.body;

    // Check balance
    const balance = await storage.getWalletBalance(userId);
    if (balance < amount) return res.status(400).json({ message: "Insufficient credits" });

    const request = await storage.createWithdrawalRequest({
      userId,
      amount: String(amount),
      paymentMethod,
      paymentDetails,
      status: 'pending'
    });
    res.status(201).json(request);
  });

  /**
   * INTIMACY GAMES
   */
  app.post(api.games.start.path, requireAuth, async (req, res) => {
    const { coupleId, gameType, intensity } = api.games.start.input.parse(req.body);
    const session = await storage.createGameSession({ coupleId, gameType, intensity, status: 'active' });
    res.status(201).json(session);
  });

  /**
   * CONSENT (Section M/N)
   */
  app.get("/api/couples/:coupleId/consent/:action", requireAuth, async (req, res) => {
    const isGranted = await storage.checkMutualConsent(Number(req.params.coupleId), req.params.action);
    res.json({ isGranted });
  });

  /**
   * SECURITY & COMPLIANCE
   */
  app.post(api.security.logAudit.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const { eventType, details } = api.security.logAudit.input.parse(req.body);
    await storage.logSecurityAudit({ userId, eventType, details, ipAddress: req.ip });
    res.status(201).json({ success: true });
  });

  /**
   * ADMIN
   */
  app.get(api.admin.stats.path, requireAdmin, async (_req, res) => {
    const stats = await storage.getAdminStats();
    res.json(stats);
  });

  /**
   * COMMUNITY SOCIAL (Section A)
   */
  app.get(api.communityFeed.listPosts.path, async (req, res) => {
    const posts = await storage.listCommunityPosts();
    res.json(posts);
  });

  app.post(api.communityFeed.createPost.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const { content, imageUrl } = req.body;
    const post = await storage.createCommunityPost(userId, content, imageUrl);
    res.status(201).json(post);
  });

  app.post(api.communityFeed.likePost.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const { success, likesCount } = await storage.likeCommunityPost(userId, Number(req.params.postId));
    res.json({ success, likesCount });
  });

  app.post(api.communityFeed.addComment.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const comment = await storage.addCommunityComment(userId, Number(req.params.postId), req.body.content);
    res.status(201).json(comment);
  });

  app.get(api.communityFeed.listComments.path, async (req, res) => {
    const comments = await storage.listCommunityComments(Number(req.params.postId));
    res.json(comments);
  });

  /**
   * NOTIFICATIONS
   */
  app.get("/api/notifications", requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const notifications = await storage.getNotifications(userId);
    res.json(notifications);
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    await storage.markNotificationAsRead(Number(req.params.id));
    res.json({ success: true });
  });

  app.patch("/api/users/me/push-token", requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const { pushToken } = req.body;
    await storage.updateUser(userId, { pushToken });
    res.json({ success: true });
  });

  return httpServer;
}
