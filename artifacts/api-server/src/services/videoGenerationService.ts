import type { VideoJob } from "@workspace/db";

export type StoryboardShot = {
  shotNumber: number;
  startSeconds: number;
  durationSeconds: number;
  framing: string;
  cameraMovement: string;
  action: string;
  continuity: string;
};

export const VIDEO_PROVIDER_STATUS = {
  provider: "unconfigured",
  status: "provider_unavailable" as const,
  message: "Video generation is not connected yet. Your storyboard is ready for a provider.",
};

export function buildStoryboard(input: {
  prompt: string;
  durationSeconds: number;
  cameraMovement: string;
  characterReferenceIds: string[];
}): StoryboardShot[] {
  const shotCount = Math.max(6, Math.ceil(input.durationSeconds / 10));
  const baseDuration = Math.floor(input.durationSeconds / shotCount);
  const remainder = input.durationSeconds % shotCount;
  const phases = [
    ["establishing wide", "A slow reveal establishes the location and the emotional weather."],
    ["medium two-shot", "The characters enter the scene and their relationship becomes readable."],
    ["close-up", "A specific reaction carries the story beat without changing the character design."],
    ["tracking wide", "The action moves through the location while the background remains coherent."],
    ["over-the-shoulder", "The camera follows the point of view and preserves screen direction."],
    ["hero close-up", "A decisive gesture or line lands with controlled anime timing."],
    ["low-angle wide", "The scene expands into its strongest visual beat."],
    ["quiet pull-back", "The camera releases the moment and leaves a clear transition point."],
  ];
  const continuity = input.characterReferenceIds.length
    ? `Maintain reference continuity for ${input.characterReferenceIds.length} uploaded character(s): same face, hair, outfit silhouette, colors, and proportions.`
    : "No character reference uploaded; preserve descriptions from the prompt across every shot.";

  let startSeconds = 0;
  return Array.from({ length: shotCount }, (_, index) => {
    const durationSeconds = baseDuration + (index < remainder ? 1 : 0);
    const [framing, action] = phases[index % phases.length];
    const shot = {
      shotNumber: index + 1,
      startSeconds,
      durationSeconds,
      framing,
      cameraMovement: input.cameraMovement,
      action: `${action} Source direction: ${input.prompt}`,
      continuity,
    };
    startSeconds += durationSeconds;
    return shot;
  });
}

export function toVideoJobResponse(job: VideoJob) {
  return {
    id: job.id,
    prompt: job.prompt,
    durationSeconds: job.durationSeconds,
    aspectRatio: job.aspectRatio,
    style: job.style,
    cameraMovement: job.cameraMovement,
    characterReferenceIds: JSON.parse(job.characterReferenceIds) as string[],
    storyboard: JSON.parse(job.storyboard) as StoryboardShot[],
    status: job.status as "provider_unavailable" | "queued" | "processing" | "complete" | "failed",
    provider: job.provider,
    outputUrl: job.outputUrl,
    message: job.message,
    createdAt: job.createdAt.toISOString(),
  };
}