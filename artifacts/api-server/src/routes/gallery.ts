import { Router, type IRouter } from "express";
import {
  GetGalleryResponse,
  LikeGalleryPostParams,
  LikeGalleryPostResponse,
} from "@workspace/api-zod";
import { db, galleryPostsTable } from "@workspace/db";
import { asc, eq, sql } from "drizzle-orm";
import { seedGallery } from "../services/galleryService";

const router: IRouter = Router();

router.get("/gallery", async (_req, res): Promise<void> => {
  let posts = await db.select().from(galleryPostsTable).orderBy(asc(galleryPostsTable.id));
  if (posts.length === 0) {
    await db.insert(galleryPostsTable).values(seedGallery);
    posts = await db.select().from(galleryPostsTable).orderBy(asc(galleryPostsTable.id));
  }

  res.json(
    GetGalleryResponse.parse(
      posts.map(({ id, imageUrl, title, creatorName, prompt, likes, style }) => ({
        id,
        imageUrl,
        title,
        creatorName,
        prompt,
        likes,
        style,
      })),
    ),
  );
});

router.post("/gallery/:id/like", async (req, res): Promise<void> => {
  const params = LikeGalleryPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [liked] = await db
    .update(galleryPostsTable)
    .set({ likes: sql`${galleryPostsTable.likes} + 1` })
    .where(eq(galleryPostsTable.id, params.data.id))
    .returning();
  if (!liked) {
    res.status(404).json({ error: "Gallery post not found" });
    return;
  }

  res.json(LikeGalleryPostResponse.parse(liked));
});

export default router;