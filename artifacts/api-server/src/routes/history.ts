import { Router, type IRouter } from "express";
import { GetHistoryResponse } from "@workspace/api-zod";
import { db, generationsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/history", async (_req, res): Promise<void> => {
  const generations = await db
    .select()
    .from(generationsTable)
    .orderBy(desc(generationsTable.createdAt))
    .limit(12);
  res.json(
    GetHistoryResponse.parse(
      generations.map(({ id, kind, prompt, imageUrl, createdAt, status }) => ({
        id,
        kind,
        prompt,
        imageUrl,
        createdAt: createdAt.toISOString(),
        status,
      })),
    ),
  );
});

export default router;