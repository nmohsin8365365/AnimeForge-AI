import { Router, type IRouter } from "express";
import { db, videoJobsTable } from "@workspace/db";
import {
  RegisterCharacterReferenceBody,
  RegisterCharacterReferenceResponse,
  GetVideoJobParams,
  GenerateVideoBody,
  GenerateVideoResponse,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { buildStoryboard, toVideoJobResponse, VIDEO_PROVIDER_STATUS } from "../services/videoGenerationService";

const router: IRouter = Router();

router.post("/character-references", (req, res): void => {
  const parsed = RegisterCharacterReferenceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const reference = {
    assetId: `character_${Date.now()}`,
    characterName: parsed.data.characterName,
    fileName: parsed.data.fileName,
    previewUrl: parsed.data.dataUrl,
    notes: parsed.data.notes ?? "",
  };

  res.json(RegisterCharacterReferenceResponse.parse(reference));
});

router.post("/generate-video", async (req, res): Promise<void> => {
  const parsed = GenerateVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const characterReferenceIds = parsed.data.characterReferenceIds ?? [];
  const storyboard = buildStoryboard({
    prompt: parsed.data.prompt,
    durationSeconds: parsed.data.durationSeconds,
    cameraMovement: parsed.data.cameraMovement,
    characterReferenceIds,
  });
  const [saved] = await db
    .insert(videoJobsTable)
    .values({
      prompt: parsed.data.prompt,
      durationSeconds: parsed.data.durationSeconds,
      aspectRatio: parsed.data.aspectRatio,
      style: parsed.data.style,
      cameraMovement: parsed.data.cameraMovement,
      characterReferenceIds: JSON.stringify(characterReferenceIds),
      storyboard: JSON.stringify(storyboard),
      status: VIDEO_PROVIDER_STATUS.status,
      provider: VIDEO_PROVIDER_STATUS.provider,
      message: VIDEO_PROVIDER_STATUS.message,
    })
    .returning();

  res.json(GenerateVideoResponse.parse(toVideoJobResponse(saved)));
});

router.get("/video-jobs/:id", async (req, res): Promise<void> => {
  const parsed = GetVideoJobParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [job] = await db.select().from(videoJobsTable).where(eq(videoJobsTable.id, parsed.data.id)).limit(1);
  if (!job) {
    res.status(404).json({ error: "Video job not found" });
    return;
  }
  res.json(GenerateVideoResponse.parse(toVideoJobResponse(job)));
});

export default router;