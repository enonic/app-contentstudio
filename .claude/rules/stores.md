---
paths:
  - "**/*.store.ts"
  - "**/*.store.tsx"
---

# Nanostores — Store Organization

Architecture: Feature-Sliced Design. Stores are nanostores atoms, maps, and computed stores.

## Store Kinds

| Kind | Type | Mutated by | Purpose |
|------|------|-----------|---------|
| **Fact** | `atom` / `map` | Commands only | Single source of truth |
| **Derived** | `computed` | Never (auto) | Projection of fact stores |
| **Signal** | `atom` | Services / subscriptions | Ephemeral event, consume and clear |

A fact store should never derive from another fact store — use `computed`.
A signal store should be consumed and cleared, never cached.

## Naming & Conventions

- All stores prefixed with `$`: `$selection`, `$permissions`
- One domain concept per store file. If you describe the file with "and," split it
- Do not place types in store files except the store's own type

## Reactive Rendering

```typescript
// ❌ .get() in render path — component won't re-render
const value = $store.get();

// ✅ useStore() for reactive rendering
const value = useStore($store);

// ✅ Subscribe to specific keys for map stores
const { account } = useStore($app, { keys: ['account'] });
```

## When .get() Is Appropriate

- Event handlers (read at click time)
- Utility functions outside components
- Inside store files for state updates
- One-time initialization or effects

## Feature File Structure

```
feature/
  types.ts              # Domain types (no store file imports)
  store.ts              # Atoms + computed (state + derivations)
  commands.ts           # Functions that mutate atoms (write path)
  hooks.ts              # useStore wrappers for components
  service.ts            # Async I/O, subscriptions
  index.ts              # Public API
```

Not every feature needs all files. Split when a file serves two audiences.

## Commands Are the Only Write Path

```typescript
// ❌ Component mutates atom directly
$selection.set(new Set([id]));

// ✅ Component calls a command
setSelection([id]);
```

Atoms are private to the feature. Commands are the public write API.

## Async at the Boundary

```typescript
// ❌ Computed store triggers fetch
const $data = computed($ids, async (ids) => fetchData(ids));

// ✅ Service subscribes and populates a fact store
// service.ts
export function initPermissionsSync(): void {
    $currentIds.subscribe(async (ids) => {
        abortController?.abort();
        abortController = new AbortController();
        const result = await fetchPermissions(ids, abortController.signal);
        $permissions.set(result);
    });
}
```

Stores are synchronous. Async enters through services that subscribe to triggers and populate fact stores.

## Computed Stores as Read Models

```typescript
// ✅ Project multiple stores into a flat context for consumers
export const $browseContext = computed(
    [$currentItems, $permissions, $childrenAllowed],
    (items, permissions, childrenAllowed): BrowseContext => ({
        isEmpty: items.length === 0,
        canPublish: permissions.includes(Permission.PUBLISH),
        childrenAllowed,
    }),
);
```

A consumer should never assemble its view by reading five atoms — that's what computed stores do.

## Initialization

```typescript
// ❌ Side effects at module load (import-order dependent)
$currentIds.subscribe(async (ids) => { ... });

// ✅ Explicit init called at app bootstrap
export function initPermissionsSync(): void {
    $currentIds.subscribe(async (ids) => { ... });
}
```

## Dependency Direction

- Features import from `shared/`, never from sibling features
- Cross-feature communication goes through shared stores
- `index.ts` exports only the public contract: commands (write), computed stores and hooks (read)
- Atoms are never exported from `index.ts`

## Store Hook Placement

Hoist store hooks at the very top of a component, before other hooks:

```typescript
export function MyComponent({ title }: Props) {
    const data = useStore($myStore);
    const { account } = useStore($app, { keys: ['account'] });

    const [count, setCount] = useState(0);
    // ...
}
```
