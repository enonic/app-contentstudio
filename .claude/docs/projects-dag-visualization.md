# Projects DAG → v6 React + zoom/pan (phased)

## Progress

- [x] P1 — Delete legacy, render an empty frame
- [x] P2 — Pure layout model (+ tests)
- [x] P3 — Positioned, unstyled cards
- [x] P4 — Edges
- [x] P5 — Styling
- [x] P6 — Zoom controls + drag pan
- [x] P7 — Wheel + keyboard
- [ ] P8 — Faster wheel zoom + shortcut hint strip

## Context

`ProjectDAGVisualization.ts` (legacy `DivEl` + imperative D3) is mounted into v6 through
`ProjectDAGWrapper.tsx` — an ad-hoc reverse bridge that `.claude/rules/legacy-to-react.md`
names as debt to delete. It also carries bug
[#11268](https://github.com/enonic/app-contentstudio/issues/11268): with many projects the
graph shrinks to unreadable size.

Root causes of #11268, all in the legacy class:

- `adjustSvgPlacement` writes `viewBox="minX minY maxX maxY"` — passing **extents** where
  SVG expects **width/height**. With `.svg-container { width: 100% }` and no explicit svg
  height, the browser scales everything to fit the panel width: more projects → smaller
  everything.
- Layout runs with a constant `nodeSize` (250×150); rect widths are patched *after* layout
  (`adjustRects`) and edges hand-shifted (`adjustEdges`), so boxes and edge endpoints drift.
- `decrossOpt()` is NP-hard — degrades badly and can hang/throw as project count grows.
- Text fitting loops `getComputedTextLength()` per character inside a `setTimeout(100)`
  after a `visibility: hidden` pass.

Target: one React tree under `pages/settings`, laid out by `d3-dag` (kept), rendered at
natural readable size inside a bounded viewport with pan + zoom. No new dependencies; the
full `d3` dependency is removed.

## Decisions

- **Stack**: keep `d3-dag@1.2.2` for sugiyama layout; nodes are absolutely-positioned HTML
  divs (Tailwind + existing `ProjectIcon`) over an SVG edge layer, both inside one
  `transform: translate(x,y) scale(k)` wrapper. Hand-rolled pan/zoom.
- **Card size**: fixed (`248 × 56`), CSS truncation — no text measuring.
- **Viewport**: fixed stage, `h-[60vh] min-h-90 max-h-[720px]`. (P5 briefly derived the height
  from the graph; that put the controls right under the lowest card, so P6 went back to a
  fixed stage — the graph is centered in it by `fitTransform` anyway.)
- **Zoom input**: buttons + drag-pan + plain wheel pan + ctrl/⌘+wheel zoom. **No pinch.**
- **Interaction**: read-only nodes — no click, no hover highlight, no active-project accent,
  **no tooltips** (not even native `title`, which the legacy version had as an SVG `<title>`).
  Tooltips are deferred to a later improvement pass, controls included.
- **Visuals**: same top-down layered shape, `@enonic/ui` tokens; main-parent edge solid,
  secondary parent edges dashed/faded. Legacy `.less` deleted.
- **`d3`** removed from `package.json` (it has no other consumer).

## Data source

No re-fetch. `initProjects()` runs in the settings entry
(`modules/app/src/main/resources/assets/js/settings.ts:37`), so `$projects`
(`v6/entities/project/projects.store.ts`) already holds the list and is kept live by
`ProjectCreated/Updated/Deleted` events. The component reads
`useStore($projects, { keys: ['projects', 'loaded'] })`. This drops legacy
`ProjectListRequest` (banned in v6 by `.claude/rules/requests.md`) and makes the graph
self-updating, which the legacy version was not.

## Target file layout

All under `v6/pages/settings/ui/item-panel/project-dag/` — page-local, nothing hoisted to
`shared/` until a second consumer exists.

| File | Introduced | Role |
|---|---|---|
| `ProjectDag.tsx` | P1 | Container: store → layout → viewport → render |
| `projectDag.layout.ts` | P2 | Pure: `Project[]` → `{ nodes, edges, width, height }` |
| `projectDag.layout.test.ts` | P2 | Layout unit tests |
| `ProjectDagCard.tsx` | P3 | One node card |
| `ProjectDagEdges.tsx` | P4 | SVG edge layer |
| `useDagViewport.ts` | P6 | Transform state, controls, pan |
| `useDagViewport.test.ts` | P6 | Pure clamp/fit/zoom-about-point helpers |
| `ProjectDagControls.tsx` | P6 | `IconButton` row + zoom % readout |

Every phase ends green on `pnpm -C ./modules/lib run check` +
`pnpm -C ./modules/lib run test:run`, then `./gradlew deploy -x test -Penv=dev` and a look at
**Settings → Projects** (root "Projects" folder selected — that is the only place the DAG
renders, see `SettingsItemStatistics.tsx:20`). Phases are committed manually, one commit each.

---

## Phase 1 — Delete legacy, render an empty frame

Removes all old code first so nothing is being ported in place.

- New `ProjectDag.tsx`: reads `$projects`, renders only the viewport frame
  (`relative overflow-hidden rounded-md border border-bdr-soft bg-surface-secondary
  h-[60vh] min-h-80 max-h-[720px]`) with a temporary node-count line inside.
- `SettingsItemStatistics.tsx`: `{showDAG && <ProjectDag />}` — `itemId` prop drops (the
  legacy constructor already ignored its `projectId` argument).
- Delete `ProjectDAGWrapper.tsx`, `app/settings/browse/statistics/view/project/ProjectDAGVisualization.ts`
  (check whether `view/project/` becomes empty), `assets/styles/project/project-dag-visualization.less`
  and its `@import` in `assets/styles/main.less:143`.
- Remove `"d3": "^7.9.0"` from `modules/lib/package.json`, `pnpm install` to refresh the
  lockfile. Keep `d3-dag`.

**Test locally**: Settings → Projects shows a framed empty box with the correct project
count; no console errors; no leftover `.project-dag-visualization` styles in the CSS bundle.

**Done.** `check:types`, `check:lint`, `check:devdeps` and the full vitest suite (136 files /
1715 tests) pass; `contentlib.css` has zero `project-dag-visualization` rules; deploy is green.
`check:boundaries` fails on this machine for an unrelated reason — dependency-cruiser rejects
node 25.2.1 (supports `^22||^24||>=26`), pre-existing and independent of this change.

## Phase 2 — Pure layout model (+ tests)

`projectDag.layout.ts` — `buildProjectDagLayout(projects): ProjectDagLayout`:

```ts
export const DAG_NODE_WIDTH = 248;
export const DAG_NODE_HEIGHT = 56;
const NODE_SIZE: readonly [number, number] = [DAG_NODE_WIDTH, DAG_NODE_HEIGHT];
const DAG_GAP: readonly [number, number] = [32, 56];
```

1. Rows for `graphStratify`: `id: getName()`, `displayName`, `language`,
   `hasIcon: !!getIcon()`, `iconHash: getIcon()?.getSha512()`, `isLayer: hasParents()`,
   `parentIds: getParents().filter(id => knownIds.has(id))` — **filtering unknown parents is
   new**; `graphStratify` throws on a missing id and would blank the panel.
2. Layout with d3-dag **defaults** (`layeringSimplex` + `decrossTwoLayer` + `coordSimplex`) —
   drop `decrossOpt()` / `coordCenter()`:

```ts
const { width, height } = sugiyama()
    .nodeSize(NODE_SIZE)
    .gap(DAG_GAP)
    .tweaks([tweakShape<ProjectDagDatum, undefined>(NODE_SIZE, shapeTopBottom)])(graph);
```

`tweakShape(…, shapeTopBottom)` clips edge endpoints to each card's top/bottom border,
replacing `adjustRects` + `adjustEdges`.

Two d3-dag gotchas found while implementing:

- `tweakSugiyama` **cannot** be combined with `tweakShape` (the plan originally used both):
  it adds a control point exactly on the node border, so the shape truncation becomes
  degenerate and the layout throws
  `line from [[280, 140]] -> [[241, 112]] ended too close …`. Dropped; `shapeTopBottom`
  alone gives the desired top/bottom attachment.
- `tweakShape` needs its generics spelled out (`<ProjectDagDatum, undefined>`), otherwise the
  operator's data type infers as `never` and the final `(graph)` call fails to typecheck —
  the `never`-inference caveat the d3-dag docs warn about.

3. Node view models: d3-dag v1 `node.x/y` are **centers**, so store
   `left = x - DAG_NODE_WIDTH / 2`, `top = y - DAG_NODE_HEIGHT / 2`.
4. Edge view models: `id: \`${source.id}--${target.id}\``,
   `isMainParent: target.data.parentIds[0] === source.data.id` (parity with the legacy
   `strokeFn`; equivalent to `Project.hasMainParentByName`), and `path: buildEdgePath(points)`.
5. Local `buildEdgePath(points)`: chained cubic béziers with control points at each segment's
   vertical midpoint — replaces `d3.line().curve(d3.curveCatmullRom)` (that is what lets the
   `d3` dep go).
6. Empty input → `{ nodes: [], edges: [], width: 0, height: 0 }`. The whole layout is wrapped
   in `try/catch` → empty layout + `console.error`, so a bad graph can never crash the
   statistics panel from inside render (`graphStratify` throws on duplicate ids).
   `getParents()` can be `undefined` on a `Project`, so it is `?? []`-guarded.

`ProjectDag.tsx` gets `const layout = useMemo(() => buildProjectDagLayout(projects), [projects])`
and the temporary debug block prints, per node, `id / layer y / left,top` plus the edge list.

**Test locally**: `projectDag.layout.test.ts` covers single root, parent chain, multi-parent
layer (one solid + one dashed edge), unknown parent id dropped instead of throwing, finite
coordinates, `width/height > 0`. In the app, the debug text should show sane increasing y per
layer and one edge per parent relation.

**Done.** 8 tests, built from real `Project.create()…build()` instances (no casts). `check:types`,
`check:lint` and the full suite (137 files / 1723 tests) pass; deploy is green. Note: d3-dag
lays out a **cyclic** parent relation without throwing, so that case is asserted as a
successful layout rather than a caught error.

## Phase 3 — Positioned, unstyled cards

- `ProjectDagCard.tsx`: minimal — `absolute` at `left/top`, fixed
  `DAG_NODE_WIDTH × DAG_NODE_HEIGHT`, plain border, text-only `displayName` and `name`.
- `ProjectDag.tsx`: inner wrapper sized `layout.width × layout.height` with
  `transformOrigin: '0 0'`, mapping nodes to cards. Debug block removed.

**Test locally**: cards sit in correct layers, no overlaps, no misalignment; graph overflows
the frame when large (expected — panning arrives in P6). Deep-layer project trees still lay
out fast (this is where `decrossTwoLayer` replaces `decrossOpt`).

**Done.** The frame keeps `overflow-auto` until P6 replaces it with pan/zoom, so an
oversized graph is still reachable by scrolling in the meantime. `ProjectDag` returns
`ReactElement | null` and renders nothing while the layout is empty. `check:types`,
`check:lint`, full suite (137 files / 1723 tests) and deploy are green.

## Phase 4 — Edges

- `ProjectDagEdges.tsx`: one `<svg>` sized to the layout,
  `className="absolute inset-0 overflow-visible"`, `<path d={edge.path} fill="none"
  stroke="currentColor">`. Rendered *before* the cards so cards paint on top.

**Test locally**: every parent relation has a curve; curves start/end exactly at card
top/bottom borders; long edges spanning layers don't cut through cards.

**Done** (shipped together with P5). The svg also carries `pointer-events-none` so it can
never intercept the drag-pan added in P6.

## Phase 5 — Styling

- Card: `bg-surface-neutral border border-bdr-soft rounded-md shadow-sm` + flex row with
  `<ProjectIcon className="size-8 shrink-0" …>` (from `v6/shared/ui/icons/ProjectIcon.tsx` —
  handles custom icon, flag, `Layers` for layers, default icon), then a `min-w-0` column:
  `truncate text-sm font-semibold` display name, `truncate text-xs text-subtle` name
  (+ language). No `title`, no tooltip. This is what deletes the
  `getIconHTML` / `adjustDisplayNames` / `adjustIds` machinery.
- Edges: `text-bdr-strong` on the svg (`currentColor`, not `stroke-*` utilities, so we don't
  depend on token→stroke utility generation); secondary parents `strokeDasharray="4 4"` +
  `opacity-40`.
- Frame: `!loaded` → `Skeleton` from `@enonic/ui`; `layout.nodes.length === 0` → `null`.

**Test locally**: light and dark theme both legible; long display names and long ids truncate
with ellipsis; custom project icons, flags, layer icon and default icon all render; visual
parity-or-better vs the old white cards.

**Done.** Second card line is `name (language)` — the legacy layout put the language on the
display-name line, but the icon already carries the flag, so it reads better on the subtle
line. `check:types`, `check:lint`, full suite (137 files / 1723 tests) and deploy are green.

Token corrections after the first visual pass (both themes were wrong):

- Canvas is `bg-surface-neutral-hover` (grey-50 / grey-900), **not** `bg-surface-secondary` —
  that token is black in light mode, so the frame came out near-black with white cards.
- Edges use `text-subtle` (grey-800 / grey-400), not `text-bdr-strong` (pure black/white):
  softer, and close to the legacy `#343434`.
- Frame height briefly followed the graph (`clamp(height + 48, 240, 720)`) to avoid an empty
  canvas. **Reverted in P6**: a content-sized frame puts the zoom controls immediately below
  the lowest card. The stage is fixed again (`h-[60vh] min-h-90 max-h-[720px]`) and the graph
  is centered inside it.
- Canvas is wrapped in a `w-max min-w-full p-6` block and centered with `mx-auto`, which pads
  the graph and centers it while it fits, without the flex-`justify-center` scroll clipping.

## Phase 6 — Zoom controls + drag pan

- `useDagViewport({ content })`: `{ x, y, k }` state. Exported pure helpers for tests:
  `clampScale(k)` (`MIN_SCALE 0.25` … `MAX_SCALE 2`), `fitTransform(content, container)`
  (`k = clampScale(min(cw/w, ch/h, 1))`, centered), `zoomAt(transform, factor, point)`.
  Fit on mount and on `ResizeObserver` resize while the user has not manually zoomed;
  refit when `layout.width/height` change. Drag pan via
  `pointerdown` → `setPointerCapture` → `pointermove` delta → `pointerup/cancel`, with
  `cursor-grab` / `cursor-grabbing`.
- `ProjectDagControls.tsx`: `IconButton` (`@enonic/ui`) with lucide `ZoomIn`, `ZoomOut`,
  `Maximize2`, `RotateCcw`, plus a zoom-% readout; absolutely positioned bottom-right,
  `bg-surface-neutral/90 border border-bdr-soft rounded-md`. `aria-label` only — no
  `Tooltip` wrapper for now (deferred with the card tooltips).
- `ProjectDag.tsx`: apply `transform: translate(x,y) scale(k)` + `willChange: 'transform'` to
  the inner wrapper; no transition under `motion-reduce`.
- i18n (English only, next to the existing `settings.statistics.*` block in
  `modules/lib/src/main/resources/i18n/phrases.properties`):
  `settings.statistics.projects.graph.zoomIn|zoomOut|reset|fit|label` — used for
  `aria-label`s and the viewport label.

**Test locally**: with ~15 projects/layers the graph stays at full size (the #11268 fix);
fit scales down only to the 0.25 floor and never to unreadable; reset returns to 100 %;
drag pans; % readout tracks; resizing the browse/detail splitter refits without distortion;
create/rename/delete a project updates the graph live (new behaviour).

**Done.** Implementation notes that differ from the sketch above:

- The frame switched from `overflow-auto` to `overflow-hidden`; the graph is now reachable
  only through the transform, and `fitTransform` runs on mount so it always starts visible.
  The P5 `w-max min-w-full p-6` + `mx-auto` centering is gone — centering is part of
  `fitTransform`/`centerTransform` (padding lives in `VIEWPORT_PADDING`, shared with the
  frame-height clamp).
- Exported helpers: `clampScale`, `fitTransform`, `centerTransform`, `zoomAt` (8 tests).
  `reset` = natural size centered; `fit` = scaled to the padded container, never above 1.
- The pan layer carries `touch-none` and `cursor-grab`/`cursor-grabbing`; pointer move/up
  listeners are attached natively in an effect while `pointerdown` comes from React, with
  `setPointerCapture` so a drag survives leaving the frame.
- Zoom buttons disable at the scale limits (`canZoomIn`/`canZoomOut`).
- i18n added: `settings.statistics.projects.graph.{zoomIn,zoomOut,fit,reset}`. No
  `…graph.label` key yet — the viewport `aria-label` lands with the keyboard support in P7.
- `VIEWPORT_PADDING` is asymmetric (`{ x: 24, top: 24, bottom: 68 }`): fit and center place
  the graph inside that band so it never sits under the controls, and the frame-height clamp
  uses `top + bottom`. Both helpers take the padding object as their last argument.
- The controls sit at `opacity-50` and go opaque on `hover` / `focus-within`, so they stay
  out of the way while reading the graph.
- `will-change-transform` is applied **only while panning**. A permanently promoted layer is
  rasterized once at its initial scale, which made card text blurry above 100 % zoom.
  Panning is a pure translate, so promoting during the drag costs no sharpness.
- The pan layer is `select-none` — dragging across cards used to select their text.

## Phase 7 — Wheel + keyboard

- Non-passive wheel listener in a `useEffect`:
  `el.addEventListener('wheel', handler, { passive: false })`. **Gotcha**: React's `onWheel`
  is registered passive at the root, so `preventDefault()` there is a no-op.
  `ctrlKey || metaKey` → `zoomAt` about the pointer (trackpad pinch arrives as ctrl+wheel);
  plain wheel → pan by `deltaX/deltaY`.
- Viewport gets `tabIndex={0}` + `aria-label`; `+` / `-` / `0` (reset) / `f` (fit).

**Test locally**: ctrl/⌘+wheel and trackpad pinch zoom toward the cursor, not the corner;
plain two-finger scroll pans without scrolling the settings panel behind it; keyboard shortcuts
work when the viewport is focused; no zoom-past-clamp.

**Done.** Details:

- Zoom factor is exponential (`wheelZoomFactor`, `Math.exp(-deltaY * 0.002)`) so each notch
  scales by a constant ratio and opposite scrolls cancel out (both asserted in tests).
- Plain wheel pans **only while the graph overflows the viewport** at the current scale;
  otherwise the event is left alone so the statistics panel keeps scrolling normally. This is
  the one deviation from "plain wheel → pan" in the sketch above.
- The wheel handler reads `transformRef`/`contentRef`, so the listener attaches once instead
  of re-binding on every transform change.
- Keys on the focused viewport: `+`/`=` in, `-`/`_` out, `0` reset, `f` fit. The viewport is
  `tabIndex={0}` with `aria-label` from the new `settings.statistics.projects.graph.label`
  phrase and a `focus-visible` ring.

## Phase 8 — Faster wheel zoom + shortcut hint strip

**Zoom speed**: `WHEEL_ZOOM_SENSITIVITY` 0.002 → 0.005 in `useDagViewport.ts`. A Chrome wheel
notch (`deltaY ≈ 100`) then scales ×1.65 instead of ×1.22; trackpad deltas are much smaller so
two-finger zoom stays smooth. `wheelZoomFactor` tests assert direction and symmetry, not
magnitude, so they stay valid.

**Hint strip instead of per-button tooltips.** Tooltips on four adjacent icon buttons pop up
constantly while aiming at them. One passive strip in the opposite corner teaches the same
thing without interrupting: `aria-label`s stay on the buttons for screen readers.

New `ProjectDagShortcuts.tsx`, bottom-left of the frame, mirroring the controls:

```
⌘ + scroll  Zoom     drag  Pan     F  Fit to view     0  Reset zoom
```

- Reveal on interaction, not always on: the frame gets `group`, the strip is `opacity-0
  group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity`. The controls move
  from their own `hover:` to the same `group-*` triggers, so pointing anywhere at the graph
  brings up both. Keeps the resting state clean.
- `text-xs text-subtle`, `flex flex-wrap gap-x-3 gap-y-1`, `pointer-events-none select-none` so
  it never blocks a drag.
- `kbd` chips: `rounded border border-bdr-soft bg-surface-neutral px-1 font-mono text-[10px]`.
  There is no existing `<kbd>` in the codebase to follow.
- Modifier symbol from `BrowserHelper.isOSX() || isIOS()` (the convention in
  `v6/shared/lib/format/shortcuts.ts` and `html-area/setupEditor.ts`) → `⌘` vs `Ctrl`.
- The bottom-left corner is inside the graph's `VIEWPORT_PADDING.bottom` band, so the strip
  never sits on a card — same guarantee the controls already have.
- Phrases: reuse `…graph.fit` / `…graph.reset` for their labels; add four small ones —
  `…graph.hint.zoom=Zoom`, `…graph.hint.pan=Pan`, `…graph.hint.scroll=scroll`,
  `…graph.hint.drag=drag` (the last two are gesture words shown inside `kbd`).

Files: `ProjectDagShortcuts.tsx` (new), `ProjectDagControls.tsx`, `ProjectDag.tsx`,
`useDagViewport.ts`, `i18n/phrases.properties`. No new tests — presentational plus one constant.

**Test locally**: ctrl/⌘+wheel feels noticeably faster but not jumpy; trackpad pinch still
smooth; the strip appears only while the pointer is over the graph (or it is focused), shows
`⌘` on macOS, wraps instead of overlapping the controls in a narrow panel, and never swallows a
drag.

---

## Verification (each phase)

1. `pnpm -C ./modules/lib run check` — types, oxlint, FSD boundaries (`pages → entities/shared`
   is legal; the new files must not import another `pages` slice), dev-deps.
2. `pnpm -C ./modules/lib run test:run` — full suite (P2 and P6 add tests).
3. `./gradlew deploy -x test -Penv=dev`, then Settings → Projects in the browser. To
   reproduce #11268 you need roughly 15+ projects/layers — create a few layers under existing
   projects.

## Deferred (not in this plan)

Tooltips (cards and controls), node interactivity, active-project highlight, pinch-to-zoom,
minimap, orientation toggle, per-node measured widths.
