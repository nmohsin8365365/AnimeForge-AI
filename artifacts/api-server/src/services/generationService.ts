import type { Generation } from "@workspace/db";

const sceneArtwork = [
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1600&q=85",
];

export function createMockSceneResult(input: {
  prompt: string;
  style: string;
  aspectRatio: string;
  id: number;
}): Omit<Generation, "createdAt"> & { createdAt: string } {
  const imageUrl = sceneArtwork[(input.id - 1) % sceneArtwork.length];
  return {
    id: input.id,
    kind: "scene",
    prompt: input.prompt,
    style: input.style,
    aspectRatio: input.aspectRatio,
    imageUrl,
    thumbnailUrl: imageUrl,
    status: "mock",
    createdAt: new Date().toISOString(),
  };
}

export function createMockCharacterResult(input: {
  prompt: string;
  fidelity: number;
  colorIntensity: number;
  id: number;
}): Omit<Generation, "createdAt"> & { createdAt: string } {
  const imageUrl = sceneArtwork[(input.id - 1) % sceneArtwork.length];
  return {
    id: input.id,
    kind: "character",
    prompt: input.prompt,
    style: `Fidelity ${input.fidelity}% · Color ${input.colorIntensity}%`,
    aspectRatio: "1:1",
    imageUrl,
    thumbnailUrl: imageUrl,
    status: "mock",
    createdAt: new Date().toISOString(),
  };
}