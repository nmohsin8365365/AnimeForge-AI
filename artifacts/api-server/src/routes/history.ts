import { Router, type IRouter } from "express";
import { GetHistoryResponse } from "@workspace/api-zod";
import { db, videoJobsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/history", async (_req, res): Promise<void> => {
  const jobs = await db
    .select()
    .from(videoJobsTable)
    .orderBy(desc(videoJobsTable.createdAt))
    .limit(12);
  res.json(
    GetHistoryResponse.parse(
      jobs.map(({ id, prompt, createdAt, status }) => ({
        id,
        kind: "video",
        prompt,
        imageUrl: "",
        createdAt: createdAt.toISOString(),
        status,
      })),
    ),
  );
});

export default router;