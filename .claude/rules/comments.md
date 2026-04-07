---
paths:
  - "**/*.{ts,tsx}"
---

# Commenting Rules

## Special Single-Line Prefixes

- `// ! ` — critical issues (bugs, security risks, breaking changes)
- `// ? ` — questions, uncertainties, rationale for unusual patterns
- `// * ` — logical section headers in large files, surrounded by blank comment lines
- `// TODO: ` — actionable future work, imperative verb, reference issue if possible

```ts
// ! Potential race condition if fetch retries here
// ? May need to memoize this selector when calls become too heavy
// TODO: [#123] Replace mock with live API
```

Section headers:

```ts
//
// * REST Utils
//

// In composite components, separate subcomponents with section headers:
//
// * MenuRoot
//

export type MenuRootProps = { /* ... */ };
const MenuRoot = ({ /* ... */ }) => { /* ... */ };
```

Never combine prefixes (e.g. `// ! TODO`). Choose one.

## Placement & Density

- Comment only non-obvious logic: algorithms, workarounds, edge cases
- Avoid commenting trivial code (simple getters/setters, obvious mappings)
- Prefer function-level JSDoc/TSDoc for public APIs over inline prose
- Keep comments inside function bodies minimal

```ts
function toBeImplemented(): void {
    /* empty */
}
```

## Style & Tone

- Complete sentences, capital letter start
- Concise: aim for <= 80 chars per line
- No emojis or casual slang
- Present tense for facts ("Returns cached value")

## Maintenance

- Update or delete comments when code changes; stale comments are worse than none
- Promote resolved `// TODO:` items to commits and remove the tag
- Convert answered `// ?` questions into docs once clarified
