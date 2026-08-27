import {
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uuidHashIdx: index("users_uuid_hash_idx").using("hash", table.uuid),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
