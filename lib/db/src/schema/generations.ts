import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const generationsTable = pgTable("generations", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(),
  prompt: text("prompt").notNull(),
  style: text("style").notNull(),
  aspectRatio: text("aspect_ratio").notNull(),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  status: text("status").notNull().default("mock"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGenerationSchema = createInsertSchema(generationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertGeneration = z.infer<typeof insertGenerationSchema>;
export type Generation = typeof generationsTable.$inferSelect;