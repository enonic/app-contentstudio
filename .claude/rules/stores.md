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

The default shape is two files per domain concept in `model/`:

```
feature/
  model/
    <name>.store.ts     # State + computed + commands (what components read and call)
    <name>.service.ts   # start()/stop() lifecycle: subscriptions, reload orchestration
  api/                  # REST calls
  ui/                   # Components
```

Add `<name>.types.ts` only when domain types are shared beyond the store's own type.
Split `commands.ts` out of the store only when the file outgrows a single audience
(e.g. the publish dialog). Do not create `types.ts`/`hooks.ts`/`commands.ts` by ritual.

## Commands Are the Only Write Path

```typescript
// ❌ Component mutates atom directly
$selection.set(new Set([id]));

// ✅ Component calls a command
setSelection([id]);
```

Atoms are private to the feature. Commands are the public write API.
Reading the feature's own map with `useStore($store, { keys })` from that feature's
UI is allowed — privacy is about writes and cross-feature access, not keyed reads.

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

// ✅ Service with explicit lifecycle, started at app bootstrap
let unsubscribers: Array<() => void> = [];

export const start = (): void => {
    if (unsubscribers.length > 0) return;
    unsubscribers = [
        $currentIds.subscribe(async (ids) => { ... }),
    ];
};

export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};
```

Services export `start`/`stop`. The app root imports `start as start<Name>Service`
and calls it in `AppElement.initialize()`. Tests call `start` explicitly (idempotent).

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
