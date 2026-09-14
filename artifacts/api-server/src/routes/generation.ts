import { Router, type IRouter } from "express";
import {
  ConvertSketchBody,
  ConvertSketchResponse,
  GenerateSceneBody,
  GenerateSceneResponse,
  UploadAssetBody,
  UploadAssetResponse,
} from "@workspace/api-zod";
import { db, generationsTable } from "@workspace/db";
import { createMockCharacterResult, createMockSceneResult } from "../services/generationService";

const router: IRouter = Router();

router.post("/generate-scene", async (req, res): Promise<void> => {
  const parsed = GenerateSceneBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [saved] = await db
    .insert(generationsTable)
    .values({
      kind: "scene",
      prompt: parsed.data.prompt,
      style: parsed.data.style,
      aspectRatio: parsed.data.aspectRatio,
      imageUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80",
      status: "mock",
    })
    .returning();

  res.json(GenerateSceneResponse.parse(createMockSceneResult({ ...parsed.data, id: saved.id })));
});

router.post("/convert-sketch", async (req, res): Promise<void> => {
  const parsed = ConvertSketchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [saved] = await db
    .insert(generationsTable)
    .values({
      kind: "character",
      prompt: parsed.data.prompt,
      style: `Fidelity ${parsed.data.fidelity}% · Color ${parsed.data.colorIntensity}%`,
      aspectRatio: "1:1",
      imageUrl:
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=85",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=80",
      status: "mock",
    })
    .returning();

  res.json(
    ConvertSketchResponse.parse(
      createMockCharacterResult({ ...parsed.data, id: saved.id }),
    ),
  );
});

router.post("/upload", (req, res): void => {
  const parsed = UploadAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  res.json(
    UploadAssetResponse.parse({
      assetId: `asset_${Date.now()}`,
      fileName: parsed.data.fileName,
      previewUrl: parsed.data.dataUrl,
    }),
  );
});

export default router;