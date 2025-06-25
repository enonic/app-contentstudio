# Content Studio Architecture

## QUICK REFERENCE FOR AI AGENTS

### CRITICAL: Where to Add New Code
**ALWAYS place new code in:** `modules/lib/src/main/resources/assets/js/v6/`
**NEVER add new code to:** `modules/lib/src/main/resources/assets/js/app/`

### Module Hierarchy
```
modules/
├── lib/     [BUILDS FIRST] Component library, all UI code
├── app/     [BUILDS SECOND] Main app entry point, minimal UI, all backend
├── rest/    [INDEPENDENT] Pure Java APIs, stable
└── testing/ [DEPRECATED] WebDriver tests, not maintained
```

### Build Commands Quick Reference
```bash
# UI Development (lib module only)
pnpm -C ./modules/lib run check:types      # Type check
pnpm -C ./modules/lib run check:lint:fix   # Lint & fix
pnpm -C ./modules/lib run test:run         # Run tests
pnpm -C ./modules/lib run build:dev        # Dev build

# Full Application Build & Deploy
./gradlew deploy -x test -Penv=dev         # Build all + deploy
```

### Technology Decision Matrix
| Component | Modern (v6) | Legacy (app) |
|-----------|-------------|--------------|
| Framework | React (via Preact) | Mixed |
| Styling | Tailwind v4 | Less/CSS |
| State | Nanostores | Mixed |
| Testing | Vitest | None |
| TypeScript | Strict mode | Mixed |

---

## PROJECT STRUCTURE

### 4-Module Architecture

**Build Order & Dependencies:**
```
1. rest  → (no dependencies)
2. lib   → (no dependencies)
3. app   → depends on lib.jar
4. testing → (deprecated, not used)
```

### Module Details Matrix

| Module | Location | Purpose | Build Tool | Output | Status |
|--------|----------|---------|------------|--------|--------|
| lib | modules/lib/ | UI components, business logic | Webpack + Vite | JAR | ACTIVE |
| app | modules/app/ | Entry point, backend code | Webpack | Enonic App | ACTIVE |
| rest | modules/rest/ | REST APIs | Gradle | JAR | STABLE |
| testing | modules/testing/ | E2E tests | WebDriver | N/A | DEPRECATED |

---

## MODULE: lib (Component Library)

**Path:** `modules/lib/`
**Purpose:** Provides 95%+ of UI components and business logic
**Build:** Dual system (Webpack for JS, Vite for CSS)
**Output:** JAR consumed by app module

### Directory Structure (MEMORIZE THIS)

```
modules/lib/
└── src/main/resources/assets/
    ├── js/
    │   ├── v6/              ⭐ NEW CODE LOCATION (MODERN)
    │   │   ├── features/    └─ Feature-based organization
    │   │   ├── components/  └─ Shared components
    │   │   └── utils/       └─ Utility functions
    │   ├── app/             ❌ LEGACY - AVOID ADDING CODE HERE
    │   └── page-editor/     🔒 SPECIFIC USE CASE ONLY
    └── styles/              🎨 Tailwind v4 + Legacy Less
```

### Code Organization Rules

**RULE 1: New Code Location**
- File path pattern: `modules/lib/src/main/resources/assets/js/v6/**/*.{ts,tsx}`
- Always use TypeScript (`.ts` or `.tsx`)
- Always use Tailwind CSS v4 classes
- Always use Nanostores for state
- Always import from `react` (not `preact`)

**RULE 2: Modern Stack (v6 directory)**
```typescript
// ✅ CORRECT - Modern v6 component
import React from 'react';           // Not 'preact'
import {useStore} from '@nanostores/preact';
import {myStore} from '../store';

export function MyComponent() {
    const value = useStore(myStore);
    return <div className="flex gap-4">{value}</div>;  // Tailwind
}
```

**RULE 3: Legacy Code (app directory)**
```typescript
// ❌ AVOID ADDING NEW CODE HERE
// modules/lib/src/main/resources/assets/js/app/
// This is legacy code maintained for compatibility only
```

### Build System (lib)

**Webpack Build (JavaScript/TypeScript):**
- Input: `src/main/resources/assets/js/**/*.ts`
- Output: Compiled ES2022 + declaration files
- Loader: SWC (fast TypeScript compilation)
- Bundle: All JavaScript modules

**Vite Build (Styles):**
- Input: `src/main/resources/assets/styles/**/*.{css,less}`
- Output: Compiled and minified CSS
- Processes: Tailwind v4 compilation + Legacy Less
- Separate: Independent from JavaScript build

**Build Scripts:**
```bash
# Production (minified, no source maps)
pnpm build:prod           # Complete: client + lib + css
pnpm build:prod:client    # TypeScript only
pnpm build:prod:lib       # Webpack only
pnpm build:prod:css       # Vite CSS only

# Development (source maps, no minification)
pnpm build:dev            # Complete: client + lib + css
pnpm build:dev:client     # TypeScript with inline maps
pnpm build:dev:lib        # Webpack dev mode
pnpm build:dev:css        # Vite dev mode
```

**Testing:**
```bash
pnpm test          # Watch mode
pnpm test:ui       # UI dashboard
pnpm test:run      # CI mode (single run)
pnpm test:coverage # With coverage report
```

**Code Quality:**
```bash
pnpm check              # All checks (types + lint)
pnpm check:types        # TypeScript check only
pnpm check:lint         # ESLint check only
pnpm check:lint:fix     # ESLint with auto-fix
```

---

## MODULE: app (Main Application)

**Path:** `modules/app/`
**Purpose:** Entry point, composition layer, ALL backend code
**Build:** Webpack (JS + Worker) + TypeScript (server)
**Output:** Deployable Enonic XP application

### Directory Structure

```
modules/app/
└── src/main/resources/
    ├── assets/
    │   ├── js/              📦 Frontend composition (minimal)
    │   │   └── main.ts      └─ Entry point
    │   └── shared-socket/   🔌 Shared Worker + WebSocket
    │       └── *.ts         └─ Real-time communication
    └── lib/                 ⚙️ Backend server-side code (ALL)
        └── **/*.js          └─ Enonic XP server integration
```

### Responsibilities

**Frontend (Minimal):**
- Initialize application (`main.ts`)
- Route setup and navigation
- Compose UI from `lib` module components
- Delegate business logic to `lib`

**Backend (All Server Code):**
- Location: `modules/app/src/main/resources/lib/`
- Language: JavaScript (Nashorn engine)
- Purpose: Enonic XP server communication
- APIs: Data fetching, content operations, XP integration

**Real-time Communication:**
- Location: `modules/app/src/main/resources/assets/shared-socket/`
- Tech: Shared Worker + WebSocket
- Purpose: Server-client real-time updates

### Dependency Resolution

```
app module depends on:
├── @enonic/ui           → npm package (design system)
├── lib-contentstudio    → Gradle JAR dependency
│   └── Unpacked to: .xp/dev/lib-contentstudio/
│   └── Linked as: workspace:* in package.json
└── @enonic/lib-admin-ui → External JAR
    └── From: Enonic Nexus OR local ../lib-admin-ui
```

### Build Scripts

```bash
pnpm build                # Complete build
pnpm build:worker         # Shared Worker only
pnpm build:client         # Client code only
pnpm build:server         # Server-side TS only

pnpm check                # All checks
pnpm check:types          # Run both client + worker checks
pnpm check:types:client   # Client types only
pnpm check:types:worker   # Worker types only
pnpm check:lint           # ESLint check
pnpm check:lint:fix       # ESLint with auto-fix
```

---

## MODULE: rest (REST API)

**Path:** `modules/rest/`
**Purpose:** Backend REST API services
**Status:** STABLE - Rarely modified
**Build:** Gradle (Java only)
**Output:** JAR

**Characteristics:**
- Pure Java (Spring-based)
- No frontend code
- Independent module (no dependencies)
- Provides RESTful endpoints
- Isolated from UI changes

---

## MODULE: testing (E2E Tests)

**Path:** `modules/testing/`
**Status:** ❌ DEPRECATED - Not maintained
**Legacy:** WebDriver-based tests

**Current Testing Approach:**
- Unit tests: Vitest in `lib` module
- Location: `modules/lib/**/*.test.ts`
- Focus: Utility functions, core logic
- Coverage target: 100%+ for utils

---

## TECHNOLOGY STACK

### Frontend Stack

| Technology | Version | Purpose | Import Pattern |
|------------|---------|---------|----------------|
| React | 18+ (via Preact 10) | UI framework | `import React from 'react'` |
| Preact | 10.27+ | React implementation | (internal, don't import) |
| TypeScript | 5.8+ | Type safety | ES2022 target |
| Tailwind CSS | v4.1+ | Styling | Utility classes |
| Nanostores | 0.11+ | State management | `@nanostores/preact` |
| Enonic UI | 0.20+ | Design system | `@enonic/ui` |
| Lucide | 0.545+ | Icons | `lucide-react` |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 21 | REST API services |
| Nashorn JS | Built-in | Server-side scripting |
| Enonic XP | 7.15+ | Platform integration |

### Build Stack

| Tool | Purpose | Config File |
|------|---------|-------------|
| Gradle | Project orchestration | `build.gradle` |
| pnpm | Package management | `package.json` |
| Webpack | JS bundling | `webpack.config.js` |
| Vite | CSS bundling | `vite.config.css.mjs` |
| SWC | TS compilation | (Webpack loader) |
| Vitest | Testing | `vitest.config.mjs` |
| ESLint | Linting | `eslint.config.js` |

---

## BUILD SYSTEM

### Gradle Build Orchestration

**Build Order (Sequential):**
```
Step 1: rest module  (Java compilation)
   ↓
Step 2: lib module   (Webpack + Vite → JAR)
   ↓
Step 3: app module   (Unpack lib JAR + Webpack → Enonic App)
```

**Environment Flags:**
- Development: `-Penv=dev` (source maps, no minification)
- Production: (default) (minified, optimized)

**Common Commands:**
```bash
# Build and deploy (skip tests)
./gradlew deploy -x test -Penv=dev

# Build lib module only
./gradlew :modules:lib:build

# Clean and rebuild
./gradlew clean build

# Build production
./gradlew build
```

### Module Build Details

**lib module build:**
1. TypeScript compilation (SWC via Webpack)
2. JavaScript bundling (Webpack)
3. CSS compilation (Vite: Tailwind + Less)
4. Declaration file generation
5. Package as JAR

**app module build:**
1. Unpack lib JAR to `.xp/dev/lib-contentstudio/`
2. Link as workspace dependency
3. Compile TypeScript (client + server)
4. Bundle with Webpack (app + worker)
5. Process CSS (Less + PostCSS)
6. Package as Enonic XP application

---

## DEVELOPMENT WORKFLOWS

### Workflow 1: UI Component Development (lib module)

**Scenario:** Adding a new React component in v6

**Steps:**
```bash
# 1. Navigate to v6 directory
cd modules/lib/src/main/resources/assets/js/v6/

# 2. Create component file
# Location: v6/features/<feature-name>/<ComponentName>.tsx

# 3. Implement component with:
#    - React imports from 'react'
#    - Tailwind CSS v4 classes
#    - TypeScript strict mode
#    - Nanostores for state

# 4. Run checks (from repo root)
pnpm -C ./modules/lib run check:types
pnpm -C ./modules/lib run check:lint:fix

# 5. Add tests if needed
# Location: v6/features/<feature-name>/<ComponentName>.test.ts

# 6. Run tests
pnpm -C ./modules/lib run test:run

# 7. Build (optional, Gradle will build)
pnpm -C ./modules/lib run build:dev
```

**File Template:**
```typescript
// modules/lib/src/main/resources/assets/js/v6/features/my-feature/MyComponent.tsx
import React from 'react';
import {useStore} from '@nanostores/preact';

interface MyComponentProps {
    title: string;
}

export function MyComponent({title}: MyComponentProps) {
    return (
        <div className="flex flex-col gap-4 p-4">
            <h1 className="text-lg font-semibold">{title}</h1>
        </div>
    );
}
```

### Workflow 2: Full Application Build & Deploy

**Scenario:** Build everything and deploy to Enonic XP

**Command:**
```bash
# From repository root
./gradlew deploy -x test -Penv=dev
```

**What happens:**
1. Gradle builds `rest` module (Java → JAR)
2. Gradle builds `lib` module (Webpack + Vite → JAR)
3. Gradle unpacks lib JAR to app module
4. Gradle builds `app` module (Webpack → Enonic App)
5. Gradle deploys to Enonic XP

**Time estimate:** 2-5 minutes (depends on cache)

### Workflow 3: Quick Type Check (lib module)

**Scenario:** Check for TypeScript errors before commit

**Command:**
```bash
pnpm -C ./modules/lib run check:types
```

**What it checks:**
- TypeScript compilation (no emit)
- Type errors in `v6/` directory
- Declaration file compatibility
- Strict mode violations

---

## DECISION TREES

### Decision: Where to Add Code?

```
START: Need to add code
│
├─ Is it frontend UI code?
│  ├─ YES → Is it new/modern code?
│  │  ├─ YES → modules/lib/.../js/v6/  ✅
│  │  └─ NO  → Modify existing in app/  ⚠️
│  └─ NO → Continue
│
├─ Is it backend/server code?
│  ├─ YES → modules/app/.../lib/  ✅
│  └─ NO → Continue
│
├─ Is it REST API code?
│  ├─ YES → modules/rest/  ✅
│  └─ NO → Continue
│
└─ Is it test code?
   ├─ YES → modules/lib/**/*.test.ts  ✅
   └─ NO → Ask for clarification
```

### Decision: Which Build Command?

```
START: Need to build
│
├─ Just type checking?
│  └─ YES → pnpm -C ./modules/lib run check:types
│
├─ UI development only (fast)?
│  └─ YES → pnpm -C ./modules/lib run build:dev
│
├─ Full app deployment?
│  └─ YES → ./gradlew deploy -x test -Penv=dev
│
├─ Production build?
│  └─ YES → ./gradlew build
│
└─ Just testing?
   └─ YES → pnpm -C ./modules/lib run test:run
```

### Decision: Which Style Approach?

```
START: Need to style component
│
├─ Is component in v6/?
│  ├─ YES → Use Tailwind CSS v4 classes  ✅
│  │       Example: className="flex gap-4 p-4"
│  └─ NO → Continue
│
├─ Is it legacy component?
│  ├─ YES → Use existing Less/CSS  ⚠️
│  │       Location: modules/lib/.../styles/
│  └─ NO → Use Tailwind  ✅
│
└─ Need custom theme?
   └─ Use Enonic UI tokens from @enonic/ui
```

---

## FILE PATH PATTERNS

### Path Pattern Reference

| Pattern | Purpose | Example |
|---------|---------|---------|
| `modules/lib/.../js/v6/**/*.tsx` | Modern React components | `v6/features/publish/PublishDialog.tsx` |
| `modules/lib/.../js/v6/**/*.ts` | Utilities, hooks, stores | `v6/utils/format/values.ts` |
| `modules/lib/.../js/v6/**/*.test.ts` | Unit tests | `v6/utils/format/values.test.ts` |
| `modules/lib/.../js/app/**/*.ts` | Legacy business logic | `app/browse/ContentBrowsePanel.ts` |
| `modules/lib/.../styles/**/*.css` | Tailwind v4 styles | `styles/main.css` |
| `modules/lib/.../styles/**/*.less` | Legacy Less styles | `styles/legacy.less` |
| `modules/app/.../js/**/*.ts` | App entry point | `js/main.ts` |
| `modules/app/.../lib/**/*.js` | Backend server code | `lib/server/content-api.js` |
| `modules/app/.../shared-socket/**/*.ts` | WebSocket worker | `shared-socket/worker.ts` |

### Import Path Patterns

```typescript
// ✅ Correct imports
import React from 'react';                    // React API
import {useStore} from '@nanostores/preact';  // Nanostores
import {Button} from '@enonic/ui';            // Enonic UI
import {MyUtil} from '../utils/MyUtil';       // Relative imports

// ❌ Incorrect imports
import {h} from 'preact';                     // Don't import Preact directly
import * as React from 'preact';              // Wrong compatibility
```

---

## LOCALIZATION

**Location:** `modules/app/src/main/resources/i18n/`

**Files:**
- `phrases.properties` - Main English localization (ADD NEW KEYS HERE)
- `phrases_*.properties` - Translations (auto-generated)
- `wcag.properties` - ARIA attributes only

**Key Categories (prefix-based):**
```
field.*    → Labels and form field text
action.*   → Buttons and clickable components
text.*     → General text content
notify.*   → Notifications and alerts
widget.*   → Widget labels and descriptions
tooltip.*  → Tooltip text
```

**Example:**
```properties
# phrases.properties
field.publishDialog.title=Publish Content
action.publishDialog.confirm=Publish Now
notify.publishDialog.success=Content published successfully
```

---

## COMMON ISSUES & SOLUTIONS

### Issue: Preact Type Incompatibility

**Problem:** Radix UI Slot refs don't match Preact types

**Solution:** Use type assertions
```typescript
// See .cursor/rules/preact.mdc for details
import {Slot} from '@radix-ui/react-slot';

// Type assertion for ref compatibility
<Slot ref={ref as any} />
```

### Issue: Build Fails with Type Errors

**Check:**
```bash
# Run type check to see errors
pnpm -C ./modules/lib run check:types

# Common causes:
# - Importing from 'preact' instead of 'react'
# - Missing type definitions
# - Strict mode violations
```

### Issue: Styles Not Updating

**Cause:** Vite CSS build not running

**Solution:**
```bash
# Rebuild CSS only
pnpm -C ./modules/lib run build:dev:css

# Or full rebuild
pnpm -C ./modules/lib run build:dev
```

### Issue: Component Not Found in app

**Cause:** lib JAR not rebuilt

**Solution:**
```bash
# Rebuild lib and app
./gradlew :modules:lib:build :modules:app:build
```

---

## SEARCH PATTERNS FOR AI AGENTS

### Finding Modern (v6) Code

```bash
# Using ast-grep
ast-grep --pattern 'export function $NAME($$$)' --lang tsx modules/lib/src/main/resources/assets/js/v6/

# Using rg
rg "export function" modules/lib/src/main/resources/assets/js/v6/ --type tsx
```

### Finding Legacy Code

```bash
# Find deprecated code
rg "TODO: Enonic UI" --type ts

# Find legacy imports
ast-grep --pattern 'import { $$$ } from "admin-ui"' --lang ts modules/lib/src/main/resources/assets/js/app/
```

### Finding State Management

```bash
# Find Nanostores usage
rg "useStore|atom|map" modules/lib/src/main/resources/assets/js/v6/ --type ts

# Find store definitions
ast-grep --pattern 'export const $NAME = atom($$$)' --lang ts
```

### Finding Components by Feature

```bash
# Find all publish-related components
rg "Publish" modules/lib/src/main/resources/assets/js/v6/features/ --type tsx

# Find dialog components
ast-grep --pattern 'export function $NAME($$$) { $$$ }' --lang tsx modules/lib/src/main/resources/assets/js/v6/features/**/dialogs/
```

---

## METADATA FOR CONTEXT EXTRACTION

**Module Priority:** lib > app > rest > testing
**New Code Location:** modules/lib/src/main/resources/assets/js/v6/
**Build System:** Gradle (orchestrator) + pnpm (packages)
**Test Framework:** Vitest (lib module only)
**Styling:** Tailwind v4 (modern) + Less (legacy)
**State Management:** Nanostores
**Framework:** React API via Preact 10 compatibility
**TypeScript Target:** ES2022
**Package Manager:** pnpm
**Primary Language:** TypeScript
**Backend Language:** Java 21 + Nashorn JavaScript
