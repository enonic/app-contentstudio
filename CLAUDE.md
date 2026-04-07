# Content Studio

Enonic XP content management application. Gradle multi-project: TypeScript, React (via Preact), Tailwind CSS v4.

## Scripts

After making changes, run `pnpm -C ./modules/lib run check` to verify nothing is broken.

| Intent | Command |
|--------|---------|
| Verify changes | `pnpm -C ./modules/lib run check` |
| Lint-fix | `pnpm -C ./modules/lib run check:lint:fix` |
| Run tests | `pnpm -C ./modules/lib run test:run` |
| Build + deploy | `./gradlew deploy -x test -Penv=dev` |

Only run Gradle when the task specifically requires it. For most changes, `pnpm check` is sufficient.

## Code Structure

- **Modern** (new code goes here): `modules/lib/src/main/resources/assets/js/v6/` — Preact/TSX, strict TypeScript, Tailwind, Nanostores
- **Legacy** (do not add to): `modules/lib/src/main/resources/assets/js/app/` — class-based, loose TypeScript
- **Localization**: `modules/lib/src/main/resources/i18n/phrases.properties`
- **Target**: ECMAScript 2022, Preact with React compat layer (`preact/compat`). Radix UI ref type mismatches expected.
- **lib-admin-ui**: linked via `.xp/dev/` directory (managed by Gradle); source: `../lib-admin-ui`
- **@enonic/ui**: source: `../enonic-ui` or `../npm-enonic-ui` (use for component docs, examples, patterns)

## Git & GitHub

No conventional commit prefixes. Plain descriptive language throughout.

### Issues

- **Title**: plain descriptive text — e.g. `Add MyComponent to browse view`, `PublishDialog: add schedule button`
- **Body**: concisely explain what and why, skip trivial details
  ```
  <4–8 sentence description: what, what's affected, how to reproduce, impact>

  #### Rationale
  <why this needs to be fixed or implemented>

  #### References            ← optional
  #### Implementation Notes  ← optional

  <sub>*Drafted with AI assistance*</sub>
  ```

### Commits

- **With issue**: `<Issue Title> #<number>` — e.g. `Add MyComponent to browse view #12`
- **Without issue**: capitalized plain-English description — e.g. `Add local Git worktrees ignore`, `Fix build`
- **Body** (optional): past tense, one line per change, 2–6 lines, backticks for code refs

### Pull Requests

- **Title**: `<Issue Title> #<number>` — matches the commit title
- **Body**: concisely explain what and why, skip trivial details. No emojis. Separate all sections with one blank line.
  ```
  <summary of changes>

  Closes #<number>

  [Claude Code session](<link>)  ← optional

  <sub>*Drafted with AI assistance*</sub>
  ```
