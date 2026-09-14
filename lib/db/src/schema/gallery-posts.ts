import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const galleryPostsTable = pgTable("gallery_posts", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  title: text("title").notNull(),
  creatorName: text("creator_name").notNull(),
  prompt: text("prompt").notNull(),
  likes: integer("likes").notNull().default(0),
  style: text("style").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGalleryPostSchema = createInsertSchema(galleryPostsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertGalleryPost = z.infer<typeof insertGalleryPostSchema>;
export type GalleryPost = typeof galleryPostsTable.$inferSelect;