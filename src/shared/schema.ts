import { mysqlTable, text, int, boolean, timestamp, json, varchar, decimal } from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===

export const profiles = mysqlTable("profiles", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  bio: text("bio"),
  gender: varchar("gender", { length: 50 }),
  orientation: varchar("orientation", { length: 100 }),
  interests: json("interests").$type<string[]>().default([]),
  relationshipGoals: varchar("relationship_goals", { length: 100 }),
  isPublic: boolean("is_public").default(true),
});

export const couples = mysqlTable("couples", {
  id: int("id").primaryKey().autoincrement(),
  partner1Id: varchar("partner1_id", { length: 36 }).notNull().references(() => users.id),
  partner2Id: varchar("partner2_id", { length: 36 }).notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  mode: varchar("mode", { length: 20 }).default("romantic"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = mysqlTable("messages", {
  id: int("id").primaryKey().autoincrement(),
  coupleId: int("couple_id").notNull().references(() => couples.id),
  senderId: varchar("sender_id", { length: 36 }).notNull().references(() => users.id),
  content: text("content").notNull(),
  type: varchar("type", { length: 20 }).default("text"),
  isExplicit: boolean("is_explicit").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const likes = mysqlTable("likes", {
  id: int("id").primaryKey().autoincrement(),
  fromUserId: varchar("from_user_id", { length: 36 }).notNull().references(() => users.id),
  toUserId: varchar("to_user_id", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cycleLogs = mysqlTable("cycle_logs", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  symptoms: json("symptoms").$type<string[]>(),
  flowIntensity: varchar("flow_intensity", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gifts = mysqlTable("gifts", {
  id: int("id").primaryKey().autoincrement(),
  senderId: varchar("sender_id", { length: 36 }).notNull().references(() => users.id),
  receiverId: varchar("receiver_id", { length: 36 }).notNull().references(() => users.id),
  giftType: varchar("gift_type", { length: 50 }).notNull(),
  creditValue: int("credit_value").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  sexStyle: varchar("sex_style", { length: 50 }),
  boundaries: json("boundaries").$type<string[]>().default([]),
  fantasies: json("fantasies").$type<string[]>().default([]),
  intensityPreference: int("intensity_preference").default(1),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const gameSessions = mysqlTable("game_sessions", {
  id: int("id").primaryKey().autoincrement(),
  coupleId: int("couple_id").notNull().references(() => couples.id),
  gameType: varchar("game_type", { length: 50 }).notNull(),
  currentStep: int("current_step").default(1),
  gameState: json("game_state").default({}),
  intensity: varchar("intensity", { length: 20 }).notNull().default("playful"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const walletTransactions = mysqlTable("wallet_transactions", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  status: varchar("status", { length: 20 }).default("completed"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const withdrawalRequests = mysqlTable("withdrawal_requests", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  paymentDetails: json("payment_details").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const securityAudits = mysqlTable("security_audits", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  severity: varchar("severity", { length: 20 }).default("low"),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const consentLogs = mysqlTable("consent_logs", {
  id: int("id").primaryKey().autoincrement(),
  coupleId: int("couple_id").notNull().references(() => couples.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  consentTarget: varchar("consent_target", { length: 100 }).notNull(),
  isGranted: boolean("is_granted").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const memories = mysqlTable("memories", {
  id: int("id").primaryKey().autoincrement(),
  coupleId: int("couple_id").notNull().references(() => couples.id),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content"),
  type: varchar("type", { length: 20 }).default("text"), // text, voice, photo
  mediaUrl: text("media_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityRooms = mysqlTable("community_rooms", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 20 }).default("public"),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityMessages = mysqlTable("community_messages", {
  id: int("id").primaryKey().autoincrement(),
  roomId: int("room_id").notNull().references(() => communityRooms.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityPosts = mysqlTable("community_posts", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  likesCount: int("likes_count").default(0),
  commentsCount: int("comments_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityComments = mysqlTable("community_comments", {
  id: int("id").primaryKey().autoincrement(),
  postId: int("post_id").notNull().references(() => communityPosts.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityLikes = mysqlTable("community_likes", {
  id: int("id").primaryKey().autoincrement(),
  postId: int("post_id").notNull().references(() => communityPosts.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // message, like, gift, system, cycle
  data: json("data"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  sentMessages: many(messages, { relationName: "sender" }),
  sentGifts: many(gifts, { relationName: "sender" }),
  receivedGifts: many(gifts, { relationName: "receiver" }),
  likesSent: many(likes, { relationName: "from" }),
  likesReceived: many(likes, { relationName: "to" }),
  notifications: many(notifications),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const couplesRelations = relations(couples, ({ one, many }) => ({
  partner1: one(users, {
    fields: [couples.partner1Id],
    references: [users.id],
  }),
  partner2: one(users, {
    fields: [couples.partner2Id],
    references: [users.id],
  }),
  messages: many(messages),
  gameSessions: many(gameSessions),
  memories: many(memories),
}));

export const communityRoomsRelations = relations(communityRooms, ({ many }) => ({
  messages: many(communityMessages),
}));

export const communityMessagesRelations = relations(communityMessages, ({ one }) => ({
  room: one(communityRooms, {
    fields: [communityMessages.roomId],
    references: [communityRooms.id],
  }),
  user: one(users, {
    fields: [communityMessages.userId],
    references: [users.id],
  }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [communityPosts.userId],
    references: [users.id],
  }),
  comments: many(communityComments),
  likes: many(communityLikes),
}));

export const communityCommentsRelations = relations(communityComments, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communityComments.postId],
    references: [communityPosts.id],
  }),
  user: one(users, {
    fields: [communityComments.userId],
    references: [users.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one }) => ({
  couple: one(couples, {
    fields: [gameSessions.coupleId],
    references: [couples.id],
  }),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  user: one(users, {
    fields: [walletTransactions.userId],
    references: [users.id],
  }),
}));

export const securityAuditsRelations = relations(securityAudits, ({ one }) => ({
  user: one(users, {
    fields: [securityAudits.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  couple: one(couples, {
    fields: [messages.coupleId],
    references: [couples.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  fromUser: one(users, {
    fields: [likes.fromUserId],
    references: [users.id],
    relationName: "from",
  }),
  toUser: one(users, {
    fields: [likes.toUserId],
    references: [users.id],
    relationName: "to",
  }),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, isAgeVerified: true, credits: true, role: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, userId: true });
export const insertCoupleSchema = createInsertSchema(couples).omit({ id: true, createdAt: true, status: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertCycleLogSchema = createInsertSchema(cycleLogs).omit({ id: true, createdAt: true });
export const insertGiftSchema = createInsertSchema(gifts).omit({ id: true, createdAt: true });
export const insertPreferenceSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });
export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(walletTransactions).omit({ id: true, createdAt: true });
export const insertWithdrawalSchema = createInsertSchema(withdrawalRequests).omit({ id: true, createdAt: true, processedAt: true });
export const insertAuditSchema = createInsertSchema(securityAudits).omit({ id: true, createdAt: true });
export const insertConsentSchema = createInsertSchema(consentLogs).omit({ id: true, timestamp: true });
export const insertMemorySchema = createInsertSchema(memories).omit({ id: true, createdAt: true });
export const insertLikeSchema = createInsertSchema(likes).omit({ id: true, createdAt: true });
export const insertCommunityMessageSchema = createInsertSchema(communityMessages).omit({ id: true, createdAt: true });
export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({ id: true, createdAt: true, likesCount: true, commentsCount: true });
export const insertCommunityCommentSchema = createInsertSchema(communityComments).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Couple = typeof couples.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type CycleLog = typeof cycleLogs.$inferSelect;
export type Gift = typeof gifts.$inferSelect;
export type UserPreference = typeof userPreferences.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type SecurityAudit = typeof securityAudits.$inferSelect;
export type ConsentLog = typeof consentLogs.$inferSelect;
export type Memory = typeof memories.$inferSelect;
export type CommunityRoom = typeof communityRooms.$inferSelect;
export type CommunityMessage = typeof communityMessages.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type CommunityComment = typeof communityComments.$inferSelect;
export type CommunityLike = typeof communityLikes.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProfile = typeof profiles.$inferInsert;
export type InsertMessage = typeof messages.$inferInsert;
export type InsertCycleLog = typeof cycleLogs.$inferInsert;
export type InsertGift = typeof gifts.$inferInsert;
export type InsertPreference = typeof userPreferences.$inferInsert;
export type InsertGameSession = typeof gameSessions.$inferInsert;
export type InsertTransaction = typeof walletTransactions.$inferInsert;
export type InsertWithdrawal = typeof withdrawalRequests.$inferInsert;
export type InsertAudit = typeof securityAudits.$inferInsert;
export type InsertConsent = typeof consentLogs.$inferInsert;
export type InsertMemory = typeof memories.$inferInsert;
export type InsertNotification = typeof notifications.$inferInsert;

export type UpdateProfileRequest = Partial<InsertProfile>;
export type CreateMessageRequest = { content: string; coupleId: number; type?: string };
export type CreateGiftRequest = { receiverId: number; giftType: string; creditValue: number };
export type UpdateGameRequest = { gameSessionId: number; gameState: any; status?: string };
