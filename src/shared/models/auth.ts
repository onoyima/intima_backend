import { sql } from "drizzle-orm";
import { mysqlTable, varchar, boolean, int, timestamp, json, index } from "drizzle-orm/mysql-core";

// Session storage table for MySQL
export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 128 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table for MySQL
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  isAgeVerified: boolean("is_age_verified").default(false),
  role: varchar("role", { length: 20 }).default("user"), // user, admin, moderator, finance
  credits: int("credits").default(0),
  inviteCode: varchar("invite_code", { length: 10 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
  pushToken: varchar("push_token", { length: 255 }),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
