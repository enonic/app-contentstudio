# Content Studio Architecture

## QUICK REFERENCE

### Where to Add New Code
- **New UI code:** `modules/lib/src/main/resources/assets/js/v6/`
- **Backend code:** `modules/app/src/main/resources/lib/`
- **Tests:** `modules/lib/**/*.test.ts`

### Module Hierarchy
```
modules/
├── lib/     [BUILDS FIRST] Component library, 95%+ of UI code
├── app/     [BUILDS SECOND] Entry point, backend, minimal UI
├── rest/    [INDEPENDENT] Pure Java REST APIs
└── testing/ [DEPRECATED] Not maintained
```

### Build Commands
See `.cursor/rules/npm-scripts.mdc` for complete reference.

```bash
# Quick checks (preferred)
pnpm -C ./modules/lib run check
pnpm -C ./modules/lib run test:run

# Full deploy
./gradlew deploy -x test -Penv=dev
./gradlew yolo -Penv=dev  # skip all checks
```

---

## PROJECT STRUCTURE

### Build Order & Dependencies
```
1. rest  → (no dependencies, pure Java)
2. lib   → (no dependencies, builds JAR)
3. app   → depends on lib.jar
```

### Module Overview

| Module | Purpose | Status |
|--------|---------|--------|
| lib | UI components, business logic | ACTIVE |
| app | Entry point, ALL backend code | ACTIVE |
| rest | REST APIs (Java) | STABLE |
| testing | E2E tests | DEPRECATED |

---

## MODULE: lib

**Path:** `modules/lib/`
**Purpose:** 95%+ of UI components and business logic
**Output:** JAR consumed by app module

### Directory Structure
```
modules/lib/src/main/resources/assets/
├── js/
│   ├── v6/           ⭐ NEW CODE HERE
│   │   ├── features/ └─ Feature-based organization
│   │   ├── components/
│   │   └── utils/
│   ├── app/          ❌ LEGACY - avoid
│   └── page-editor/  🔒 Specific use case
└── styles/           🎨 Tailwind v4 + Less
```

### Code Rules
See `.cursor/rules/` for detailed patterns:
- `structure.mdc` - File organization
- `react.mdc` - Component patterns
- `typescript.mdc` - Type definitions
- `tailwind.mdc` - Styling

---

## MODULE: app

**Path:** `modules/app/`
**Purpose:** Entry point, composition, ALL backend code
**Output:** Deployable Enonic XP application

### Directory Structure
```
modules/app/src/main/resources/
├── assets/
│   ├── js/main.ts        📦 Frontend entry
│   └── shared-socket/    🔌 WebSocket worker
└── lib/                  ⚙️ ALL backend code
    └── **/*.js           └─ Enonic XP server
```

### Dependencies
```
app depends on:
├── @enonic/ui           → npm (design system)
├── lib-contentstudio    → local JAR via .xp/dev/
└── @enonic/lib-admin-ui → Maven OR local ../lib-admin-ui
```

---

## BUILD SYSTEM

### Complete Build Flow

```
1. lib-admin-ui (external)
   ├─ With -Penv=dev + ../lib-admin-ui exists → local composite build
   └─ Otherwise → Enonic Maven repository

2. modules/lib (first)
   ├─ copyDevResources → extracts lib-admin-ui to .xp/dev/
   ├─ pnpmInstall → links via workspace:* protocol
   ├─ pnpmBuild → TypeScript + Webpack + Vite CSS
   └─ devJar → packages for app module

3. modules/app (second)
   ├─ copyDevResources → extracts lib-admin-ui + lib-contentstudio
   ├─ pnpmInstall → links workspace packages
   ├─ pnpmBuild → TypeScript + Webpack
   └─ jar → final XP application
```

### .xp/dev Mechanism

Bridges Gradle JARs with pnpm workspace:

1. `copyDevResources` extracts JAR contents to `.xp/dev/`
2. `pnpm-workspace.yaml` includes `.xp/dev/*` as packages
3. `workspace:*` protocol links these in package.json
4. Vite/Webpack can import from linked packages

### When to Use What

| Scenario | Command |
|----------|---------|
| TS/JS checks | `pnpm -C ./modules/lib run check` |
| Unit tests | `pnpm -C ./modules/lib run test:run` |
| Full deploy | `./gradlew deploy -x test -Penv=dev` |
| Fast iteration | `./gradlew yolo -Penv=dev` |
| Java changed | `./gradlew deploy -Penv=dev` |

**Rule:** Use pnpm for TS/JS; Gradle for full build or Java changes.

### Java Tests
- Gradle `test` task runs Java tests
- Use `-x test` when only TS/JS changed

### Composite Build
With `-Penv=dev` and `../lib-admin-ui` exists:
- Gradle includes as composite build
- Local changes override Maven version

---

## DECISION TREES

### Where to Add Code?
```
Need to add code
├─ Frontend UI? → modules/lib/.../js/v6/  ✅
├─ Backend/server? → modules/app/.../lib/  ✅
├─ REST API? → modules/rest/  ✅
└─ Tests? → modules/lib/**/*.test.ts  ✅
```

### Which Build Command?
```
Need to build
├─ Type checking only? → pnpm check:types
├─ UI dev (fast)? → pnpm build:dev
├─ Full deploy? → ./gradlew deploy -x test -Penv=dev
├─ Production? → ./gradlew build
└─ Testing? → pnpm test:run
```

### Which Styling?
```
Need to style
├─ In v6/? → Tailwind CSS v4  ✅
├─ Legacy? → Existing Less/CSS  ⚠️
└─ Theme tokens? → @enonic/ui
```

---

## FILE PATHS

| Pattern | Purpose |
|---------|---------|
| `lib/.../js/v6/**/*.tsx` | Modern components |
| `lib/.../js/v6/**/*.ts` | Utils, hooks, stores |
| `lib/.../js/v6/**/*.test.ts` | Unit tests |
| `lib/.../js/app/**/*.ts` | Legacy code |
| `app/.../lib/**/*.js` | Backend server |
| `app/.../shared-socket/**/*.ts` | WebSocket |

---

## LOCALIZATION

**Location:** `modules/lib/src/main/resources/i18n/`

**Key prefixes:**
- `field.*` - Labels
- `action.*` - Buttons
- `text.*` - Content
- `notify.*` - Notifications
- `tooltip.*` - Tooltips

---

## SEARCH PATTERNS

```bash
# Modern v6 code
rg "export function" modules/lib/.../js/v6/

# Legacy code markers
rg "TODO: Enonic UI" --type ts

# Nanostores
rg "useStore|atom|map" modules/lib/.../js/v6/

# Feature components
rg "Dialog|Panel" modules/lib/.../js/v6/features/
```

---

## METADATA

- **New code:** `modules/lib/.../js/v6/`
- **Build:** Gradle + pnpm
- **Test:** Vitest (lib only)
- **Style:** Tailwind v4 (new) + Less (legacy)
- **State:** Nanostores
- **Framework:** React via Preact 10
- **Target:** ES2022
