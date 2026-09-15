import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const videoJobsTable = pgTable("video_jobs", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  aspectRatio: text("aspect_ratio").notNull(),
  style: text("style").notNull(),
  cameraMovement: text("camera_movement").notNull(),
  characterReferenceIds: text("character_reference_ids").notNull().default("[]"),
  storyboard: text("storyboard").notNull(),
  status: text("status").notNull().default("provider_unavailable"),
  provider: text("provider").notNull().default("unconfigured"),
  outputUrl: text("output_url"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVideoJobSchema = createInsertSchema(videoJobsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertVideoJob = z.infer<typeof insertVideoJobSchema>;
export type VideoJob = typeof videoJobsTable.$inferSelect;