# AnimeForge AI

AnimeForge AI is a full-stack anime creation studio for turning student and creator prompts or sketches into mock anime scenes and characters.

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
- `artifacts/api-server/src/routes/` — Express endpoints for scene generation, sketch conversion, uploads, gallery, likes, and history.
- `artifacts/api-server/src/services/` — replaceable mock generation and gallery service layer.
- `lib/api-spec/openapi.yaml` — source of truth for the shared API contract.
- `lib/db/src/schema/` — Drizzle tables for generations and gallery posts.

## Architecture decisions

- Mock generation results are stored in PostgreSQL so a real image or image-to-image provider can replace the service layer without changing the client contract.
- Uploaded sketches are currently registered as preview data URLs for the prototype; persistent binary storage can be added later behind the same upload endpoint.
- The frontend uses generated React Query hooks from the OpenAPI contract rather than hand-written fetch wrappers.
- Authentication screens intentionally remain provider-ready UI; real account/session handling can be added through Clerk without coupling it to the generation forms.

## Product

- Create mock anime scenes from prompts with style and aspect-ratio controls.
- Upload a PNG/JPG/WEBP sketch, preview it immediately, tune fidelity and color, and convert it into a mock character result.
- View generation history, browse and like student gallery posts, verify student status, and see credit/pricing plans.
- Use responsive mobile navigation and login/sign-up screens.

## User preferences

- Keep the visual direction futuristic, dark, neon-accented, glassy, and approachable for beginners.
- Keep prototype AI behavior clearly labeled as mock until a real provider is connected.

## Gotchas

- API changes start in `lib/api-spec/openapi.yaml`, then regenerate with `pnpm --filter @workspace/api-spec run codegen`.
- Run `pnpm run typecheck:libs` after DB schema or API contract changes before checking leaf packages.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
