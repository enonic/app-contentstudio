# Content Studio

Enonic XP content management application. Gradle multi-project: TypeScript, React (via Preact), Tailwind CSS v4.

## Commands

pnpm scripts (preferred for TS/JS work):
```bash
# From repo root - lib module
pnpm -C ./modules/lib run check           # typecheck + lint
pnpm -C ./modules/lib run check:lint:fix  # lint with auto-fix
pnpm -C ./modules/lib run test:run        # run tests

# From repo root - app module
pnpm -C ./modules/app run check           # typecheck + lint
pnpm -C ./modules/app run check:lint:fix  # lint with auto-fix
```

Gradle (full build cycle, or when Java code changes):
```bash
./gradlew deploy -x test -Penv=dev  # Build + deploy, skip Java tests
./gradlew yolo -Penv=dev            # Fast build, skip all checks
```

## Critical Constraints

- Preact with React compat layer (preact/compat). Radix UI ref type mismatches expected.
- Target: ECMAScript 2022
- TypeScript required for all code
- New UI code location: `modules/lib/src/main/resources/assets/js/v6/`
- Localization: `modules/lib/src/main/resources/i18n/phrases.properties`
- lib-admin-ui linked via `.xp/dev/` directory (managed by Gradle); source: `../lib-admin-ui`
- `@enonic/ui` source: `../enonic-ui` or `../npm-enonic-ui` (use for component docs, examples, patterns)

## Code Standards

Detailed rules in `.cursor/rules/`:
- `npm-scripts.mdc` - pnpm & Gradle commands
- `preact.mdc` - Preact/React compatibility
- `react.mdc` - Component patterns
- `typescript.mdc` - Type definitions
- `tailwind.mdc` - Styling conventions
- `testing.mdc` - Test patterns (Vitest)
- `comments.mdc` - Documentation style
- `structure.mdc` - File organization

## Architecture

See `.cursor/docs/architecture.md` for project structure, modules, and build system details.

## Skills

- `issue-writer` - Create or modify GitHub issues
- `docs-finder` - Search external documentation

## External Docs

Use Context7 MCP for React, Preact, Tailwind CSS v4, Gradle documentation.
Request specific topics, not full manuals.
