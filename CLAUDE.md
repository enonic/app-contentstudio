# AI Assistant Usage Guide

> **Purpose**: This file documents how AI assistant is used in this project, including workflows, preferences, and integration patterns. This helps maintain consistency across development sessions and serves as a reference for team members.

## 📋 Quick Reference

### Project Context

- **Project Type**: Enonic XP application
- **Tech Stack**: TypeScript, React, Tailwind CSS, Gradle, Less, Enonic XP
- **Architecture**: Application is a Gradle multi-project, with a single application project, a shared library project, and a REST API project.
- **Usage**: Deployable application

> **Note**: This project uses Preact with React compatibility layer. Some type incompatibilities with React-ecosystem libraries (e.g., Radix UI Slot refs) are expected. See `.cursor/rules/preact.mdc` for compatibility notes and solutions.

## 📚 Rules and Documentation

This project uses a set of rules and documentation to help the AI assistant understand the project and the codebase.

- `.cursor/docs/` - Project documentation for AI context
- `.cursor/rules/` - Coding standards and conventions

### .cursor/ Directory Structure

```
.cursor/
├── docs/              # Project documentation for AI context
└── rules/             # Coding standards and conventions
    ├── comments.mdc
    ├── npm-scripts.mdc
    ├── preact.mdc
    ├── react.mdc
    ├── structure.mdc
    ├── tailwind.mdc
    ├── testing.mdc
    └── typescript.mdc
```

### Usage Instructions

1. **Context Loading**: Agent automatically reads `.cursor/docs/` for project context
2. **Rule Enforcement**: Coding standards from `.cursor/rules/` related to the code applied both during code writing and code reviews.

## 📖 External Documentation (Context7 MCP)

Use the Context7 MCP server to fetch the latest, authoritative docs for external libraries whenever it is available.

### How to use

- Resolve the library ID first (exact name where possible), then request focused topics.
- Prefer narrow topics (e.g., "hooks", "dark mode", "library mode") over whole manuals.
- Keep token budgets conservative; summarize and cite instead of pasting long excerpts.
- If the server is unavailable, fall back to local docs or trusted sources.

### Retrieval guidance

- Choose the most authoritative match if multiple libraries resolve.
- Request specific topics; avoid multi-topic queries.
- Align results and recommendations with our stack and constraints.

### Output expectations

- Quote minimally; include the source and provide actionable guidance.
- Do not dump large doc blocks; provide links or identifiers when helpful.

## 📝 Coding Preferences & Standards

### Code Style

- **Language**: TypeScript preferred, JavaScript when necessary. See `tsconfig.json` for details
- **Formatting**: Biome with 4-space indentation for code files (TypeScript and JavaScript). 2-space indentation for config files (Less, JSON, YAML, etc.). See `.editorconfig` and `biome.json` for details
- **Linting**: ESLint default config + custom rules. See `eslint.config.js` for details
- **Testing**: Vitest + Happy DOM. See `vitest.config.mjs` for details
- **Comments**: JSDoc for public APIs, inline for complex logic. See `.cursor/rules/comments.mdc` for details

### Architecture Patterns

- **Frontend**: Component composition, custom hooks, nanostores for state management
- **Testing**: Vitest + Happy DOM for unit tests
- **Build System**: Gradle with pnpm, dual build (Webpack + Vite)

#### Project Structure

The application is organized as a Gradle multiproject with four distinct modules:

- **`app`** - Main Content Studio UI application (entry point, minimal frontend code)
- **`lib`** - Shared component library and utilities (provides almost all UI for the App module)
- **`rest`** - Backend REST API services (Java-based, stable and unchanged)
- **`testing`** - End-to-end testing suite (mostly legacy, deprecated)

#### Module Details

**`modules/lib/`** (Component Library):
- `src/main/resources/assets/js/app/` - Legacy business logic and main app code
- `src/main/resources/assets/js/page-editor/` - Custom module to render and edit pages from within the /app Wizard part
- `src/main/resources/assets/js/v6/` - **All new code should be placed here** (modern React components with Tailwind CSS v4)
- `src/main/resources/assets/styles/` - Tailwind CSS v4 configuration and legacy Less styles

**`modules/app/`** (Main Application):
- `src/main/resources/assets/js/` - Minimal frontend code to compose and run code from `modules/lib/`
- `src/main/resources/assets/shared-socket/` - Shared Worker + WebSocket for real-time server-client communication
- `src/main/resources/lib/` - **All backend code** - Server-side JS to communicate with Enonic XP server

#### Localozation

Localization is handled via `i18n` folder. You only need to search and add new phrases to the english localization file (the ones without `_<locale>` suffix).

- `src/main/resources/i18n/` - All the localization files are placed here.
- `src/main/resources/i18n/phrases.properties` - Main localization entries, grouped by categories: `filed.*` for any labels and texts, `action.*` for buttons and clickable components, `text.*` for any texts, `notify.*` for any notifications, `widget.*` for any widget labels and texts, `tooltip.*` for any tooltips. All other categories are mostly legacy.
- `src/main/resources/i18n/wcag.properties` - Localization of ARIA attributes only, something, that is not rendered on the page, but is used for accessibility.

### Error Handling

Refer to rules under `.cursor/rules/`.

### File-Specific Standards

When working with specific file types, consult the corresponding rule file:

- **`*.tsx` components**: See `.cursor/rules/react.mdc` and `.cursor/rules/preact.mdc`
- **Styling**: See `.cursor/rules/tailwind.mdc` for class naming utilities. If it's a legacy Less file, just keep consistent with the existing styling.
- **Tests**: See `.cursor/rules/testing.mdc` for test structure and patterns
- **TypeScript**: See `.cursor/rules/typescript.mdc` for type definitions and patterns

### Comments

In short, when adding comments, use the following prefixes:
- `// ! ` - for critical issues that demand immediate attention (bugs, security risks, breaking changes)
- `// ? ` - for questions, uncertainties, clarifications, or rationale for unusual patterns
- `// * ` - for logical blocks in large files
- `// TODO: ` - for actionable future work

More:
- Use JSDoc for public APIs, and inline comments for complex logic.
- `// TODO: Enonic UI - <reason>` to comment on the code that expected to be removed after full Enonic UI adoption.
- Add @deprecated JSDoc tag to the old code that is deprecated and expected to be removed after full Enonic UI adoption.

See `.cursor/rules/comments.mdc` for details.

## 🧪 Testing Strategy

### Test Types & Coverage

- **Unit Tests**: 100%+ coverage for utility functions
- **Component Tests**: Partial coverage for components, only if needed and has complex isolated inner logic, focus on UI and behavior

## 📚 Documentation Standards

### Code Documentation

- **Functions**: JSDoc with @param, @returns, @throws
- **Classes**: Purpose, usage examples, constructor params
- **Modules**: Overview comment explaining responsibility
- **Complex Logic**: Inline comments explaining "why" not "what"

## 📋 Project-Specific Context

### Technical Constraints

- Support ECMAScript 2022
- Preact is used via React compatibility layer. Always import from `react`, not `preact`.

### Running the build

Agent will usually run from the root of the project, so to run the package.json scripts, for specific module, use `pnpm -C ./modules/lib run <command>` or `pnpm -C ./modules/app run <command>`.

#### Lib project

When developing some UI features in the lib project, it's only necessary to run package.json scripts, not the full Gradle build.

Commands that are required to see errors are:
- `check:types` - to check type errors
- `check:lint:fix` - to check linting errors and fix some of them automatically
- `test:run` - to run unit tests, if there are any tests for the changed code

#### App project

App project depends on the lib project, so it's necessary to run the full Gradle build.
 The best way to do that is to run:
 - `./gradlew deploy -x test -Penv=dev` - to build Lib modules, and then build and deploy App using Lib as one of the dependencies.

## 🛠️ Terminal Tools Usage

### ast-grep (Code Searching & Refactoring)

Use `ast-grep` for structural code search and refactoring in TypeScript/React files. It's particularly useful for finding patterns and performing codebase-wide transformations.

**Finding React/Preact patterns:**
```bash
# Find all useState hooks
ast-grep --pattern 'useState($$$)' --lang tsx modules/lib/src/main/resources/assets/js/v6/

# Find all components with specific props
ast-grep --pattern 'interface $NAME { $PROP: boolean }' --lang ts

# Find all imports from a specific module
ast-grep --pattern 'import { $$$ } from "@enonic-ui/react"' --lang tsx

# Find functional components
ast-grep --pattern 'export function $NAME($$$): JSX.Element { $$$ }' --lang tsx
```

**Refactoring examples:**

```bash
# Replace legacy class names with Tailwind classes (dry-run first)
ast-grep --pattern 'className="old-class"' --rewrite 'className="new-class"' --lang tsx

# Update hook imports
ast-grep --pattern 'import { useState } from "react"' \
  --rewrite 'import { useState, useEffect } from "react"' --lang tsx

# Fix Preact compatibility issues
ast-grep --pattern 'import * as React from "preact"' \
  --rewrite 'import * as React from "react"' --lang tsx
```

**Legacy code detection:**

```bash
# Find deprecated Admin UI components
ast-grep --pattern 'import { $$$ } from "admin-ui"' --lang ts modules/lib/src/main/resources/assets/js/app/

# Find v6 (modern) components
ast-grep --pattern 'export function $NAME($$$)' --lang tsx modules/lib/src/main/resources/assets/js/v6/
```

### rg (ripgrep - Fast Content Search)

Use `rg` for fast text-based searches across the codebase. It's faster than grep and respects `.gitignore` by default.

**Searching for code patterns:**

```bash
# Find all TODO comments related to Enonic UI migration
rg "TODO: Enonic UI" --type ts

# Find all uses of a specific function (ts type includes .ts and .tsx)
rg "publishContent" --type ts

# Find localization keys
rg "field\." modules/lib/src/main/resources/i18n/phrases.properties

# Search in specific directories only
rg "useState" modules/lib/src/main/resources/assets/js/v6/

# Case-insensitive search with context
rg -i "publish.*dialog" --type ts -A 3 -B 3
```

**Finding component usage:**

```bash
# Find all imports of a component
rg "import.*PublishDialog" --type ts

# Find all usages of a specific hook
rg "usePublishDialog" --type ts -A 2

# Find prop usage in components
rg "contentId=" --type ts modules/lib/src/main/resources/assets/js/v6/
```

**Configuration & build files:**

```bash
# Search in package.json files
rg "\"script\":" --type json --glob "**/package.json"

# Find Gradle dependencies (using glob)
rg "implementation" -g "*.gradle"

# Find environment-specific code
rg "process\.env" --type ts
```

**Debugging & error handling:**

```bash
# Find console statements (should be removed in production)
rg "console\.(log|warn|error)" --type ts

# Find error handling patterns
rg "try.*catch" --type ts -A 5

# Find FIXME and critical comments
rg "(FIXME|// !)" --type ts
```

**Combining with other tools:**

```bash
# Find files with specific pattern, then open with fzf
rg "useState" --files-with-matches --type ts | fzf

# Count occurrences of a pattern per file
rg "useEffect" --type ts --count

# Find files NOT matching a pattern
rg "import.*from.*react" --files-without-match --type ts
```

### Best Practices

1. **Use ast-grep for structural searches** - When you need to find code by its AST structure (functions, imports, hooks)
2. **Use rg for text-based searches** - When you need to find strings, comments, or simple patterns
3. **Limit search scope** - Target specific directories (e.g., `modules/lib/src/main/resources/assets/js/v6/`) to reduce noise
4. **Use type filters** - `--type ts` (includes tsx), `--type json` to focus on relevant files
5. **Dry-run refactoring** - Always test ast-grep rewrites on a small subset before applying codebase-wide
