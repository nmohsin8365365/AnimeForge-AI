# AnimeForge AI

AnimeForge AI is a full-stack anime video-planning studio for turning detailed student and creator prompts into minimum 60-second, multi-shot anime scene jobs.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/animeforge-ai/src/App.tsx` — responsive product UI, auth screens, generation flows, gallery, history, and pricing.
- `artifacts/animeforge-ai/src/index.css` — AnimeForge visual system, effects, and responsive utilities.
- `artifacts/api-server/src/routes/` — Express endpoints for video planning, character references, legacy generation, gallery, likes, and history.
- `artifacts/api-server/src/services/` — provider-ready video generation and gallery service layers.
- `lib/api-spec/openapi.yaml` — source of truth for the shared API contract.
- `lib/db/src/schema/` — Drizzle tables for video jobs, legacy generations, and gallery posts.

## Architecture decisions

- Video requests are stored in PostgreSQL as provider-independent jobs with a generated storyboard; the current provider adapter deliberately returns `provider_unavailable` until a real video API or GPU worker is connected.
- Character references are registered with asset IDs and preview data URLs for the current provider-free prototype. Persistent object storage and authenticated ownership should be added before production uploads.
- The frontend uses generated React Query hooks from the OpenAPI contract rather than hand-written fetch wrappers.
- Authentication screens intentionally remain provider-ready UI; real account/session handling can be added through Clerk without coupling it to the generation forms.

## Product

- Create a detailed minimum 60-second anime video job with duration, style, aspect ratio, camera movement, and character reference controls.
- Generate a storyboard with multiple shots and continuity notes instead of displaying unrelated mock image results.
- View video-job history, browse and like student gallery posts, verify student status, and see pricing plans.
- Use responsive mobile navigation and login/sign-up screens.

## User preferences

- Keep the visual direction futuristic, dark, neon-accented, glassy, and approachable for beginners.
- Keep provider-unavailable video behavior clearly labeled and never substitute a mock image for a video result.

## Gotchas

- API changes start in `lib/api-spec/openapi.yaml`, then regenerate with `pnpm --filter @workspace/api-spec run codegen`.
- Run `pnpm run typecheck:libs` after DB schema or API contract changes before checking leaf packages.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
