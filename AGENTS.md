# Repository Guidelines

## Project Structure & Module Organization
This Next.js app keeps routing and UI inside `app/`, organized by feature folders with colocated `page.tsx`, `layout.tsx`, and server actions. Shared UI lives in `components/`, while reusable TypeScript helpers and API clients belong in `lib/`. Database schema, Drizzle migrations, and seeding SQL files are under `db/`; update these alongside any data model change. Static files go to `public/`. Integration utilities and custom CLIs live in `scripts/`. Place Vitest specs in `lib/__tests__`, mirroring the module path and ending with `.test.ts`.

## Build, Test, and Development Commands
Use `pnpm dev` for a Turbopack-powered local server at `http://localhost:3000`. `pnpm build` produces an optimized production bundle, and `pnpm start` runs that bundle. `pnpm lint` runs Biome’s lint rules; fix formatting with `pnpm format`. Database workflows rely on Drizzle: `pnpm db:generate` updates SQL snapshots, `pnpm db:push` syncs schema to the connected database, and `pnpm migrate` executes the scripted migration runner. Keep Docker helpers (`docker-compose.dev.yml`, `build-and-export.ps1`) in sync with new runtime requirements.

## Coding Style & Naming Conventions
Biome enforces two-space indentation, single quotes in TS/JS, and import organization; run it before committing. Components and hooks use `PascalCase`/`camelCase`, while Next.js route folders stay lowercase with hyphenated segments when necessary. Server files in `app/` should default export a React component or handler and colocate server utilities in `lib/`. Prefer explicit return types on exported functions, and keep shared types in `lib/types.ts`.

## Testing Guidelines
Vitest with Testing Library powers unit and integration tests. Add new specs under `lib/__tests__`, naming files `<feature>.test.ts` and using descriptive test names. Run `pnpm test` for a one-off suite or `pnpm test:watch` during development. Aim to cover new branches and user flows; mock external services and seed data using helpers in `lib/__tests__/utils.test.ts`. Update fixtures whenever schemas in `db/` change.

## Commit & Pull Request Guidelines
Follow Conventional Commit semantics shown in history (`feat(auth): ...`, `chore(deploy): ...`). Scope commits around one logical change, and include Drizzle snapshots or generated files when relevant. Pull requests need: a concise summary, linked issues or task IDs, screenshots or recordings for UI tweaks, and checkboxes confirming `pnpm lint`, `pnpm test`, and required database commands have run. Request review before merging and wait for CI to pass.