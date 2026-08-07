# Dungeon of the Basilisk - Agent Instructions

## Project Overview

Dungeon of the Basilisk is a local turn-based board game for 1 to 6 players.

The current implementation uses:

- React 19
- TypeScript
- Vite
- SVG rendering
- Local questions and localized text
- vite-plugin-singlefile for standalone HTML builds

The project does not use Babylon.js.

## Product Constraints

The game must remain playable without a backend, user account, API key, or mandatory external service.

Preserve support for:

- English
- Polish
- Ukrainian
- Russian
- Japanese

Do not remove existing languages or silently change translated strings.

## Current Gameplay

Players move from their starting positions toward the central basilisk.

Dice distribution:

- corridor: 3 faces
- door: 2 faces
- monster: 1 face

Door encounters use quiz questions.

Monster and boss encounters use rock-paper-scissors.

A monster loss causes a skipped turn.

A boss loss eliminates the player.

A boss victory ends the game.

Do not change these rules unless explicitly requested.

## Priorities

1. Preserve working gameplay.
2. Prevent regressions.
3. Keep changes small and reviewable.
4. Improve type safety.
5. Add deterministic tests.
6. Separate game rules from rendering gradually.
7. Preserve offline/local operation.
8. Avoid unnecessary dependencies.

## Architecture Rules

- Keep pure game logic independent from React where practical.
- React components should render state and dispatch actions rather than own complex game rules.
- Do not migrate to Redux, Zustand, MobX, or another state library without explicit approval.
- Do not replace SVG rendering without explicit approval.
- Do not introduce a game engine.
- Avoid global mutable state.
- Do not use `any`, `@ts-ignore`, or disabled compiler checks as fixes.
- Prefer explicit domain types.
- Keep random number generation replaceable or injectable when touching random logic.
- Keep animations separate from rule resolution when practical.
- Do not perform a full rewrite of `App.tsx` in one task.

## Randomness

The project currently uses `Math.random` in several places.

When modifying random behavior:

- preserve current probability distributions;
- make logic testable;
- do not silently change outcomes;
- do not introduce cryptographic randomness;
- prefer dependency injection or a small random-source abstraction.

## Timers and Asynchronous Work

The project uses `setTimeout` and asynchronous flavor text.

When changing timed logic:

- avoid stale state;
- clean up timers where necessary;
- prevent actions from a previous game session affecting a restarted game;
- do not shorten or lengthen animations unless requested.

## Localization

All user-visible gameplay text should come from the localization system.

Do not hard-code new visible text directly into components.

When adding a localization key, add it for every supported language or clearly report missing translations.

## Build and Quality Checks

Before completing a code task, run all relevant checks:

```bash
npm run typecheck
npm run test:run
npm run build
```

Do not claim success if any command fails.

## Build Artifacts

The Vite production build is written to:

```text
release/
```

Do not commit or manually edit generated `release/` files unless explicitly requested. `release/` is ignored by Git.

The repository previously contained `product-build/` as a manually prepared legacy artifact. Treat it as generated distribution output, not source.

## External Resources

The current `index.html` loads Tailwind from a CDN.

Do not change the styling system or offline packaging as a side effect of unrelated tasks.

If working on offline packaging, explicitly verify the game with network access disabled.

## Workflow

Before editing:

1. Inspect the relevant files.
2. State the intended scope.
3. Identify behavior that must remain unchanged.
4. Prefer the smallest viable change.

After editing:

1. Run type checking.
2. Run tests.
3. Run the production build.
4. Summarize changed files.
5. Report unresolved risks separately.
6. Do not mix unrelated cleanup into the same task.

## Git Rules

- One logical task per branch.
- One logical task per commit where practical.
- Do not commit `node_modules/`.
- Do not commit generated `release/` output unless explicitly requested.
- Do not force-push without explicit approval.
- Do not merge directly into the main branch.
