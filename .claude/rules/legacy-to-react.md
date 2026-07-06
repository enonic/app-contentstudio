---
paths:
  - "**/v6/**/*Element.tsx"
  - "**/v6/**/*Element.ts"
  - "**/v6/shared/ui/LegacyElement.tsx"
---

# Legacy → Single React Root

Goal: the app becomes pure React under one root at `Body`, with logic in v6 stores.
Today the visible shell is still legacy lib-admin-ui (`AppWrapper`, `ContentBrowsePanel`,
`ContentWizardPanel`, `ContextView`) and v6 React is embedded as many islands. We unwrap
those islands leaves-first until the React root owns the whole layout.

## The Bridge Is One-Directional

`LegacyElement<C>` (v6/shared/ui) mounts a React component **inside** the legacy `Element`
tree (legacy-hosts-React). Every `<Name>Element` adapter is this pattern, and **every
instance creates its own React root** — that is the "many roots" problem. `AppElement`
(the v6 root) currently renders only portaled dialogs, not the layout.

State crosses the boundary only through:
1. **Shared nanostores** — the real backbone; both sides read/write `entities/*`,
   `widgets/context-panel/model/*`, etc.
2. **lib-admin-ui events** fired from React handlers (`new EditContentEvent(...).fire()`).
3. **Callbacks passed as props** closing over legacy atoms.

## Unwrapping an Island

When an island's parent becomes React, delete its `<Name>Element` adapter and use the
component directly. An adapter is ready to delete when it is a thin mount boundary whose
only job is `render()` + imperative prop setters.

- **Move logic out, not in.** Selection bridges, `Action[]` prop plumbing, and event
  wiring move into v6 stores/commands (`stores.md`: commands are the only write path).
  Never grow the adapter.
- **Kill the legacy escape hatches** as you unwrap: a migrated component must not fire
  lib-admin-ui events, read `Store.instance()`, or take legacy `Action`/`Aggregation`
  objects as props — route through stores/services instead.
- **No-op `ExtensionItemViewType` shims** (`layout()`/`setContentAndUpdateView()` returning
  `Q()`) exist only to satisfy the legacy host; they disappear with the adapter.

## Reverse Bridge: React Hosts Legacy

Inverting the root needs the opposite direction — a React component embedding a still-legacy
`Element` — which today is ad-hoc (`ProjectDAGWrapper.tsx`, `SettingsItemPanelElement.tsx`).
Formalize it into one shared `shared/ui/LegacyIsland` (ref + `appendChild` + `render` +
cleanup on unmount) so shells can be React while their heavy legacy children stay embedded
temporarily.

```typescript
// pattern to formalize (from ProjectDAGWrapper.tsx)
useEffect(() => {
    ref.current = new LegacyPanel(itemId);
    container.current.appendChild(ref.current.getHTMLElement());
    void ref.current.render();
    return () => ref.current?.remove();   // MUST clean up
}, [itemId]);
```

## Fix the Unmount Leak First

`LegacyElement.remove()` never calls `unmountComponentAtNode` — React trees leak while
both worlds coexist. Add explicit unmount on `remove()` before doing volume unwrapping,
since churny lists (`ContentListItem`) create and drop roots constantly.

## Leaves-First Order

1. Context-panel widgets (`DetailsWidget`, `VersionsWidget`, `DependenciesWidget`,
   `ImportContentWidget`) — already store-driven with no-op shims; make `ContextView` React.
2. `WidgetsSelector` + context-panel host.
3. Presentational leaves + preview panel (`PreviewLabel`, `PreviewContextMenu`,
   `PreviewToolbar`, `ContentItemPreviewPanel`).
4. Browse shell — fold `AppWrapper` + `ContentAppContainer` into a React `BrowseAppShell`;
   embed the legacy browse panel via `LegacyIsland` temporarily.
5. Browse toolbar + filter — move `Action[]` coupling into `app/actions.store` first.
6. Browse tree + selection bridge (`ContentTreeList`) — replace the `SelectionChange`
   callback with store subscriptions; then dismantle legacy `ContentBrowsePanel`.
7. Settings app (self-contained second entry).
8. Dialog leaves (`PublishItemsList`, `SelectionStatusBar`, `ContentListItem`) as their
   host dialogs port.
9. Wizard toolbar & tabs — after actions are store-backed.
10. Live-view + page editor, then `ContentWizardPanel` / `FrameContainer` — deepest, last.
11. Collapse: `AppElement` renders the full layout; retire the legacy shell append in
    `main.ts`/`settings.ts`; replace remaining lib-admin-ui `ui2/*` roots with native React.

## Don't Add New Roots

New v6 UI is composed as React children of an existing tree. Only reach for a new
`LegacyElement` adapter when bridging into a shell that is still legacy — and record it as
debt to remove, not as the destination.
