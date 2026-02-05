import { db } from "./db";
import {
  users, profiles, couples, messages, cycleLogs, gifts,
  userPreferences, gameSessions, walletTransactions, withdrawalRequests,
  securityAudits, consentLogs, memories, likes,
  communityRooms, communityMessages, communityPosts, communityComments, communityLikes,
  notifications,
  type User, type InsertUser,
  type Profile, type InsertProfile, type UpdateProfileRequest,
  type Couple, type Message, type CycleLog, type InsertCycleLog,
  type Gift, type InsertGift,
  type GameSession, type InsertGameSession,
  type WalletTransaction, type InsertTransaction,
  type WithdrawalRequest, type InsertWithdrawal,
  type SecurityAudit, type InsertAudit,
  type ConsentLog, type InsertConsent,
  type Memory, type InsertMemory,
  type UserPreference, type InsertPreference,
  type CommunityRoom, type CommunityMessage,
  type CommunityPost, type CommunityComment, type CommunityLike,
  type Notification, type InsertNotification
} from "@shared/schema";
import { eq, or, and, desc, asc, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { sendPushNotification } from "./notifications";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: any): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  verifyAge(userId: string): Promise<User>;

  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: any): Promise<Profile>;
  updateProfile(userId: string, profile: UpdateProfileRequest): Promise<Profile>;
  listPublicProfiles(): Promise<(Profile & { user: User })[]>;
  recordLike(fromUserId: string, toUserId: string): Promise<boolean>;
  getMatches(userId: string): Promise<User[]>;
  pairByInviteCode(userId: string, code: string): Promise<Couple>;
  sendGift(fromUserId: string, toUserId: string, giftType: string, amount: number): Promise<Gift>;

  // Couples
  getCouple(id: number): Promise<Couple | undefined>;
  getCouplesForUser(userId: string): Promise<(Couple & { partner: User })[]>;
  createCouple(partner1Id: string, partner2Id: string): Promise<Couple>;

  // Messages
  getMessages(coupleId: number): Promise<Message[]>;
  createMessage(coupleId: number, senderId: string, content: string, type?: string): Promise<Message>;

  // Cycle
  getCycleLogs(userId: string): Promise<CycleLog[]>;
  createCycleLog(log: any): Promise<CycleLog>;

  // Wallet & Economy
  getWalletBalance(userId: string): Promise<number>;
  createTransaction(transaction: any): Promise<WalletTransaction>;
  createWithdrawalRequest(request: any): Promise<WithdrawalRequest>;

  // Games
  getGameSession(id: number): Promise<GameSession | undefined>;
  createGameSession(session: any): Promise<GameSession>;
  updateGameSession(id: number, updates: Partial<GameSession>): Promise<GameSession>;

  // Security & Consent
  logSecurityAudit(audit: any): Promise<SecurityAudit>;
  logConsent(userId: string, action: string, partnerId?: string): Promise<void>;
  checkMutualConsent(coupleId: number, action: string): Promise<boolean>;
  listAudits(): Promise<any[]>;

  // Preferences
  getUserPreferences(userId: string): Promise<UserPreference | undefined>;
  updateUserPreferences(userId: string, prefs: Partial<InsertPreference>): Promise<UserPreference>;

  // Memories
  getMemories(coupleId: number): Promise<Memory[]>;
  createMemory(coupleId: number, memory: any): Promise<Memory>;

  // Admin
  getAdminStats(): Promise<any>;
  listAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User>;
  listAllWithdrawals(): Promise<any[]>;
  processWithdrawal(id: number, status: 'approved' | 'rejected'): Promise<void>;
  getSystemStats(): Promise<any>;

  // Community
  listCommunityRooms(): Promise<CommunityRoom[]>;
  getCommunityMessages(roomId: number): Promise<any[]>;
  createCommunityMessage(roomId: number, userId: string, content: string): Promise<CommunityMessage>;

  // Relationship Health (Section G)
  getRelationshipHealth(coupleId: number): Promise<any>;
  seedCommunityRooms(): Promise<void>;

  // Community Social
  createCommunityPost(userId: string, content: string, imageUrl?: string): Promise<CommunityPost>;
  listCommunityPosts(): Promise<(CommunityPost & { user: User })[]>;
  likeCommunityPost(userId: string, postId: number): Promise<{ success: boolean; likesCount: number }>;
  addCommunityComment(userId: string, postId: number, content: string): Promise<CommunityComment>;
  listCommunityComments(postId: number): Promise<(CommunityComment & { user: User })[]>;
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: any): Promise<Notification>;
  markNotificationAsRead(notificationId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = uuidv4();
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    await db.insert(users).values({ ...insertUser, id, inviteCode });
    const user = await this.getUser(id);
    return user!;
  }

  async upsertUser(user: any): Promise<User> {
    const [existing] = await db.select().from(users).where(eq(users.id, user.id));
    if (existing) {
      await db.update(users).set(user).where(eq(users.id, user.id));
      return (await this.getUser(user.id))!;
    }
    await db.insert(users).values(user);
    return (await this.getUser(user.id))!;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    await db.update(users).set(data).where(eq(users.id, id));
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user!;
  }

  async verifyAge(userId: string): Promise<User> {
    await db.update(users)
      .set({ isAgeVerified: true })
      .where(eq(users.id, userId));
    return (await this.getUser(userId))!;
  }

  // Profiles
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(insertProfile: any): Promise<Profile> {
    const [result] = await db.insert(profiles).values(insertProfile);
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, result.insertId));
    return profile;
  }

  async updateProfile(userId: string, updates: UpdateProfileRequest): Promise<Profile> {
    const existing = await this.getProfile(userId);
    if (!existing) {
      return this.createProfile({ ...updates, userId });
    }
    await db.update(profiles)
      .set(updates)
      .where(eq(profiles.userId, userId));
    return (await this.getProfile(userId))!;
  }

  async listPublicProfiles(): Promise<(Profile & { user: User })[]> {
    const rows = await db.select().from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.isPublic, true));

    return rows.map(r => ({ ...r.profiles, user: r.users }));
  }

  async recordLike(fromUserId: string, toUserId: string): Promise<boolean> {
    // 1. Record the like
    await db.insert(likes).values({ fromUserId, toUserId });

    // 2. Check for mutual match
    const [mutual] = await db.select()
      .from(likes)
      .where(and(eq(likes.fromUserId, toUserId), eq(likes.toUserId, fromUserId)));

    if (mutual) {
      // Create a "pending" couple entry for the match
      await this.createCouple(fromUserId, toUserId);

      // Notify both users
      const user1 = await this.getUser(fromUserId);
      const user2 = await this.getUser(toUserId);
      await this.notifyUser(fromUserId, "It's a Match! 💖", `You matched with ${user2?.firstName}!`, 'match');
      await this.notifyUser(toUserId, "It's a Match! 💖", `You matched with ${user1?.firstName}!`, 'match');

      return true;
    }

    return false;
  }

  async getMatches(userId: string): Promise<User[]> {
    // Find all users where (likes from me to them) AND (likes from them to me)
    const matchesFromMe = await db.select({ toUserId: likes.toUserId })
      .from(likes)
      .where(eq(likes.fromUserId, userId));

    const matchesToMe = await db.select({ fromUserId: likes.fromUserId })
      .from(likes)
      .where(eq(likes.toUserId, userId));

    const mutualUserIds = matchesFromMe
      .filter(m => matchesToMe.some(mt => mt.fromUserId === m.toUserId))
      .map(m => m.toUserId);

    if (mutualUserIds.length === 0) return [];

    return await db.select()
      .from(users)
      .where(sql`${users.id} IN (${mutualUserIds})`);
  }

  async pairByInviteCode(userId: string, code: string): Promise<Couple> {
    const [partner] = await db.select().from(users).where(eq(users.inviteCode, code));
    if (!partner) throw new Error("Invalid invite code");
    if (partner.id === userId) throw new Error("You cannot pair with yourself");

    // Check if already paired
    const [existing] = await db.select().from(couples).where(
      or(
        and(eq(couples.partner1Id, userId), eq(couples.partner2Id, partner.id)),
        and(eq(couples.partner1Id, partner.id), eq(couples.partner2Id, userId))
      )
    );

    if (existing) {
      if (existing.status === 'active') return existing;
      await db.update(couples).set({ status: 'active' }).where(eq(couples.id, existing.id));
      return (await this.getCouple(existing.id))!;
    }

    const [result] = await db.insert(couples).values({
      partner1Id: userId,
      partner2Id: partner.id,
      status: 'active'
    });

    return (await this.getCouple(result.insertId))!;
  }

  async sendGift(fromUserId: string, toUserId: string, giftType: string, amount: number): Promise<Gift> {
    const [sender] = await db.select().from(users).where(eq(users.id, fromUserId));
    if (!sender || (sender.credits || 0) < amount) throw new Error("Insufficient credits");

    // 1. Deduct credits
    await db.update(users).set({ credits: (sender.credits || 0) - amount }).where(eq(users.id, fromUserId));

    // 2. Add credits to receiver
    const [receiver] = await db.select().from(users).where(eq(users.id, toUserId));
    if (receiver) {
      await db.update(users).set({ credits: (receiver.credits || 0) + amount }).where(eq(users.id, toUserId));
    }

    // 3. Add gift record
    const [result] = await db.insert(gifts).values({
      senderId: fromUserId,
      receiverId: toUserId,
      giftType: giftType,
      creditValue: amount,
      status: 'sent'
    });

    const gift = (await db.select().from(gifts).where(eq(gifts.id, result.insertId)))[0];

    // Notify receiver
    await this.notifyUser(toUserId, "You received a gift! 🎁", `Someone sent you a ${giftType}.`, 'gift');

    return gift;
  }

  // Safety & Consent
  async logSecurityAudit(audit: any): Promise<SecurityAudit> {
    const [result] = await db.insert(securityAudits).values(audit);
    const [entry] = await db.select().from(securityAudits).where(eq(securityAudits.id, result.insertId));
    return entry!;
  }

  async logConsent(userId: string, action: string, partnerId?: string): Promise<void> {
    const couples = await this.getCouplesForUser(userId);
    const coupleId = couples[0]?.id || 0;

    await db.insert(consentLogs).values({
      userId,
      coupleId,
      consentTarget: action,
      isGranted: true,
    });
  }

  async checkMutualConsent(coupleId: number, action: string): Promise<boolean> {
    const logs = await db.select().from(consentLogs)
      .where(and(eq(consentLogs.coupleId, coupleId), eq(consentLogs.consentTarget, action)));

    // Check if both partners in the couple have at least one record of consent for this target
    const [couple] = await db.select().from(couples).where(eq(couples.id, coupleId));
    if (!couple) return false;

    const partner1Consented = logs.some(l => l.userId === couple.partner1Id && l.isGranted);
    const partner2Consented = logs.some(l => l.userId === couple.partner2Id && l.isGranted);

    return partner1Consented && partner2Consented;
  }

  async listAudits(): Promise<any[]> {
    return await db.select().from(securityAudits).orderBy(desc(securityAudits.createdAt)).limit(100);
  }

  // Admin
  async listAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    await db.update(users).set({ role }).where(eq(users.id, userId));
    return (await this.getUser(userId))!;
  }

  async listAllWithdrawals(): Promise<any[]> {
    return await db.select()
      .from(withdrawalRequests)
      .leftJoin(users, eq(withdrawalRequests.userId, users.id))
      .orderBy(desc(withdrawalRequests.createdAt));
  }

  async processWithdrawal(id: number, status: 'approved' | 'rejected'): Promise<void> {
    await db.update(withdrawalRequests)
      .set({ status, processedAt: new Date() })
      .where(eq(withdrawalRequests.id, id));
  }

  async getSystemStats(): Promise<any> {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [coupleCount] = await db.select({ count: sql<number>`count(*)` }).from(couples);
    const [giftSum] = await db.select({ total: sql<number>`sum(credit_value)` }).from(gifts);

    return {
      users: userCount.count,
      couples: coupleCount.count,
      economyVolume: giftSum.total || 0,
      systemHealth: "Optimal"
    };
  }

  // Couples
  async getCouple(id: number): Promise<Couple | undefined> {
    const [couple] = await db.select().from(couples).where(eq(couples.id, id));
    return couple;
  }

  async getCouplesForUser(userId: string): Promise<(Couple & { partner: User })[]> {
    const rows = await db.select().from(couples)
      .where(or(eq(couples.partner1Id, userId), eq(couples.partner2Id, userId)));

    const results = [];
    for (const couple of rows) {
      const partnerId = couple.partner1Id === userId ? couple.partner2Id : couple.partner1Id;
      const partner = await this.getUser(partnerId);
      if (partner) {
        results.push({ ...couple, partner });
      }
    }
    return results;
  }

  async createCouple(partner1Id: string, partner2Id: string): Promise<Couple> {
    const [result] = await db.insert(couples).values({
      partner1Id,
      partner2Id,
      status: 'active'
    });
    const [couple] = await db.select().from(couples).where(eq(couples.id, result.insertId));
    return couple!;
  }

  // Messages
  async getMessages(coupleId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.coupleId, coupleId))
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(coupleId: number, senderId: string, content: string, type: string = 'text'): Promise<Message> {
    const [result] = await db.insert(messages).values({
      coupleId,
      senderId,
      content,
      type
    });
    const message = (await db.select().from(messages).where(eq(messages.id, result.insertId)))[0];

    // Notify partner
    const couple = await this.getCouple(coupleId);
    if (couple) {
      const partnerId = couple.partner1Id === senderId ? couple.partner2Id : couple.partner1Id;
      const sender = await this.getUser(senderId);
      await this.notifyUser(partnerId, "New Message 💬", `${sender?.firstName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`, 'message', { coupleId });
    }

    return message!;
  }

  // Cycle
  async getCycleLogs(userId: string): Promise<CycleLog[]> {
    return await db.select().from(cycleLogs)
      .where(eq(cycleLogs.userId, userId))
      .orderBy(desc(cycleLogs.startDate));
  }

  async createCycleLog(log: any): Promise<CycleLog> {
    const [result] = await db.insert(cycleLogs).values(log);
    const [entry] = await db.select().from(cycleLogs).where(eq(cycleLogs.id, result.insertId));
    return entry!;
  }

  // Wallet & Economy
  async getWalletBalance(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    return user?.credits || 0;
  }

  async createTransaction(transaction: any): Promise<WalletTransaction> {
    const [result] = await db.insert(walletTransactions).values(transaction);
    const amount = Number(transaction.amount);
    await db.update(users)
      .set({ credits: sql`${users.credits} + ${amount}` })
      .where(eq(users.id, transaction.userId));
    const [tx] = await db.select().from(walletTransactions).where(eq(walletTransactions.id, result.insertId));
    return tx!;
  }

  async createWithdrawalRequest(request: any): Promise<WithdrawalRequest> {
    const [result] = await db.insert(withdrawalRequests).values(request);
    const [withdrawal] = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, result.insertId));
    return withdrawal!;
  }

  // Games
  async getGameSession(id: number): Promise<GameSession | undefined> {
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, id));
    return session;
  }

  async createGameSession(session: any): Promise<GameSession> {
    const [result] = await db.insert(gameSessions).values(session);
    const [newSession] = await db.select().from(gameSessions).where(eq(gameSessions.id, result.insertId));
    return newSession!;
  }

  async updateGameSession(id: number, updates: Partial<GameSession>): Promise<GameSession> {
    await db.update(gameSessions)
      .set(updates)
      .where(eq(gameSessions.id, id));
    return (await this.getGameSession(id))!;
  }

  // Preferences
  async getUserPreferences(userId: string): Promise<UserPreference | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async updateUserPreferences(userId: string, prefs: Partial<InsertPreference>): Promise<UserPreference> {
    const existing = await this.getUserPreferences(userId);
    if (!existing) {
      const [result] = await db.insert(userPreferences).values({ ...prefs, userId } as any);
      const [newPrefs] = await db.select().from(userPreferences).where(eq(userPreferences.id, result.insertId));
      return newPrefs!;
    }
    await db.update(userPreferences)
      .set(prefs)
      .where(eq(userPreferences.userId, userId));
    return (await this.getUserPreferences(userId))!;
  }

  // Memories
  async getMemories(coupleId: number): Promise<Memory[]> {
    return await db.select().from(memories)
      .where(eq(memories.coupleId, coupleId))
      .orderBy(desc(memories.createdAt));
  }

  async createMemory(coupleId: number, memory: any): Promise<Memory> {
    const [result] = await db.insert(memories).values({ ...memory, coupleId });
    const [newMemory] = await db.select().from(memories).where(eq(memories.id, result.insertId));
    return newMemory!;
  }

  // Community
  async listCommunityRooms(): Promise<CommunityRoom[]> {
    return await db.select().from(communityRooms);
  }

  async getCommunityMessages(roomId: number): Promise<any[]> {
    return await db.select({
      id: communityMessages.id,
      content: communityMessages.content,
      createdAt: communityMessages.createdAt,
      user: {
        id: users.id,
        firstName: users.firstName
      }
    })
      .from(communityMessages)
      .innerJoin(users, eq(communityMessages.userId, users.id))
      .where(eq(communityMessages.roomId, roomId))
      .orderBy(desc(communityMessages.createdAt))
      .limit(50);
  }

  async createCommunityMessage(roomId: number, userId: string, content: string): Promise<CommunityMessage> {
    const [result] = await db.insert(communityMessages).values({ roomId, userId, content });
    const [msg] = await db.select().from(communityMessages).where(eq(communityMessages.id, result.insertId));
    return msg!;
  }

  async seedCommunityRooms(): Promise<void> {
    const existing = await db.select().from(communityRooms);
    if (existing.length === 0) {
      await db.insert(communityRooms).values([
        { name: "The First Date", description: "Icebreakers and first-time connection stories.", icon: "coffee" },
        { name: "Spiritual Bonds", description: "Deep values and soul-level matching discussions.", icon: "sparkles" },
        { name: "Intimacy Lab", description: "Open conversations about boundaries and health.", icon: "microscope" },
        { name: "Gifting Circle", description: "Share and receive tokens of appreciation publically.", icon: "gift" }
      ]);
    }
  }

  // Community Social Implementation
  async createCommunityPost(userId: string, content: string, imageUrl?: string): Promise<CommunityPost> {
    const [result] = await db.insert(communityPosts).values({ userId, content, imageUrl });
    const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, result.insertId));
    return post!;
  }

  async listCommunityPosts(): Promise<(CommunityPost & { user: User })[]> {
    const rows = await db.select()
      .from(communityPosts)
      .innerJoin(users, eq(communityPosts.userId, users.id))
      .orderBy(desc(communityPosts.createdAt));

    return rows.map(r => ({ ...r.community_posts, user: r.users }));
  }

  async likeCommunityPost(userId: string, postId: number): Promise<{ success: boolean; likesCount: number }> {
    const [existing] = await db.select()
      .from(communityLikes)
      .where(and(eq(communityLikes.userId, userId), eq(communityLikes.postId, postId)));

    if (existing) {
      await db.delete(communityLikes).where(eq(communityLikes.id, existing.id));
      await db.update(communityPosts)
        .set({ likesCount: sql`likes_count - 1` })
        .where(eq(communityPosts.id, postId));
    } else {
      await db.insert(communityLikes).values({ userId, postId });
      await db.update(communityPosts)
        .set({ likesCount: sql`likes_count + 1` })
        .where(eq(communityPosts.id, postId));
    }

    const [post] = await db.select({ likesCount: communityPosts.likesCount }).from(communityPosts).where(eq(communityPosts.id, postId));
    return { success: !existing, likesCount: post?.likesCount || 0 };
  }

  async addCommunityComment(userId: string, postId: number, content: string): Promise<CommunityComment> {
    const [result] = await db.insert(communityComments).values({ userId, postId, content });
    await db.update(communityPosts)
      .set({ commentsCount: sql`comments_count + 1` })
      .where(eq(communityPosts.id, postId));
    const [comment] = await db.select().from(communityComments).where(eq(communityComments.id, result.insertId));
    return comment!;
  }

  async listCommunityComments(postId: number): Promise<(CommunityComment & { user: User })[]> {
    const rows = await db.select()
      .from(communityComments)
      .innerJoin(users, eq(communityComments.userId, users.id))
      .where(eq(communityComments.postId, postId))
      .orderBy(asc(communityComments.createdAt));

    return rows.map(r => ({ ...r.community_comments, user: r.users }));
  }

  // Relationship Health (Section G)
  async getRelationshipHealth(coupleId: number): Promise<any> {
    // Basic logic for "Emotional Distance Detection"
    const resentMessages = await db.select().from(messages)
      .where(eq(messages.coupleId, coupleId))
      .orderBy(desc(messages.createdAt))
      .limit(20);

    if (resentMessages.length === 0) return { score: 50, status: 'initializing' };

    const lastMsgDate = new Date(resentMessages[0].createdAt!);
    const daysSinceLast = (new Date().getTime() - lastMsgDate.getTime()) / (1000 * 60 * 60 * 24);

    let score = 80;
    if (daysSinceLast > 3) score -= 20;
    if (daysSinceLast > 7) score -= 30;

    return {
      score: Math.max(0, score),
      status: score > 70 ? 'Connected' : score > 40 ? 'Drifting' : 'Distance Detected',
      lastInteraction: lastMsgDate
    };
  }

  async getAdminStats(): Promise<any> {
    return this.getSystemStats();
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(insertNotification: any): Promise<Notification> {
    const [result] = await db.insert(notifications).values({
      ...insertNotification,
      isRead: false
    });
    const [entry] = await db.select().from(notifications).where(eq(notifications.id, result.insertId));
    return entry!;
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async notifyUser(userId: string, title: string, body: string, type: string, data?: any) {
    await this.createNotification({ userId, title, body, type, data });
    const user = await this.getUser(userId);
    if (user?.pushToken) {
      await sendPushNotification(user.pushToken, title, body, type, data);
    }
  }
}

export const storage = new DatabaseStorage();
