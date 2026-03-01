# Repository Guidelines

## Project Structure & Module Organization
This repository is a `pnpm` monorepo.
- `apps/admin`: Next.js 14 admin web console (`app/`, `components/`, `lib/`).
- `apps/mobile`: Expo React Native app (`src/screens`, `src/components`, `src/hooks`).
- `packages/api`: NestJS backend (`src/*` modules such as `auth`, `slots`, `bookings`).
- `packages/shared`: Shared TypeScript types and Zod schemas.
- `packages/db`: Drizzle schema, migrations, and DB scripts.
- `tests/e2e-web`: Playwright browser tests.
- `tests/e2e-mobile`: WebdriverIO + Appium mobile E2E tests.
- `docs/spec`: API, DB, and screen specifications.

## Build, Test, and Development Commands
Use Node `>=18` and `pnpm >=8`.
- `pnpm dev`: Run all app/package dev servers in parallel.
- `pnpm build`: Build all workspaces recursively.
- `pnpm lint`: Run ESLint across workspaces.
- `pnpm typecheck`: TypeScript checks across workspaces.
- `pnpm test`: Run workspace test suites.
- `pnpm test:e2e:web`: Run Playwright web E2E.
- `pnpm test:e2e:mobile:ios` / `pnpm test:e2e:mobile:android`: Run mobile E2E suites.
- `pnpm format` / `pnpm format:check`: Apply/check Prettier formatting.

## Coding Style & Naming Conventions
- TypeScript-first codebase; keep strict typing and avoid `any` (warned by ESLint).
- Prettier rules: 2 spaces, single quotes, semicolons, trailing commas (`es5`), 80-char width.
- Follow existing file naming patterns:
  - React components: `PascalCase.tsx` (e.g., `StatusBadge.tsx`).
  - Hooks: `useX.ts` (e.g., `useSlots.ts`).
  - Tests: `*.spec.ts`.
- Run `pnpm lint && pnpm typecheck` before opening a PR.

## Testing Guidelines
- API unit/integration tests use Jest in `packages/api`.
- Web E2E uses Playwright with specs under `tests/e2e-web/tests`.
- Mobile E2E uses WebdriverIO/Appium under `tests/e2e-mobile/tests`.
- Keep tests focused on user-visible behavior and API contracts.
- Add or update tests for any behavior change, especially auth, slots, offers, and bookings flows.

## Commit & Pull Request Guidelines
- Current history uses Conventional Commit style (example: `chore: ...`); continue with `feat:`, `fix:`, `chore:`, etc.
- Keep commits scoped and atomic; avoid mixing unrelated refactors.
- PRs should include:
  - concise problem/solution summary,
  - linked issue/ticket,
  - test evidence (commands + result),
  - screenshots/video for UI changes (`apps/admin`, mobile flows).
- Highlight env/config changes and any migration impact (`packages/db`) in the PR description.
