# Form2 Migration Design

## Context

Content Studio's v6 wizard renders content forms using a simplified string-only, path-based system (nanostores + `getDraftStringByPath`). This supports only TextLine and TextArea. lib-admin-ui's `form2/` directory provides a complete descriptor layer (14 types), ComponentRegistry, OccurrenceManager, and React components (TextLine, TextArea, UnsupportedInput, OccurrenceList with drag-and-drop).

This plan replaces v6's form layer with the form2-based approach, enabling all 25+ input types.

## Repositories

- **lib-admin-ui**: `~/repo/lib-admin-ui` — form2 hooks, generic components
- **app-contentstudio**: `~/repo/app-contentstudio` — form pipeline, CS-specific types

## Phase Overview

| Phase | Scope | Where |
|-------|-------|-------|
| 1 | Foundation hooks | lib-admin-ui |
| 2 | Form rendering pipeline | CS v6 |
| 3 | Wire into wizard + store changes | CS v6 |
| 4 | Editing support | CS v6 + lib-admin-ui |
| 5 | Remaining generic components (12) | lib-admin-ui |
| 6 | CS-specific input types (11) | CS v6 |
| 7 | Nested structures (ItemSet, OptionSet) | CS v6 |
| 8 | Validation integration | CS v6 |
| 9 | Cleanup | CS v6 |

---

## Phase 1: Foundation Hooks (lib-admin-ui)

**Goal**: Add `usePropertyArray` and `useInputTypeDescriptor` hooks to `form2/hooks/`.

### 1.1 Create `usePropertyArray` hook

**File**: `form2/hooks/usePropertyArray.ts`

Bridges PropertyArray events to React state. This is the core reactivity mechanism replacing nanostores' `$changedPaths`.

```typescript
type UsePropertyArrayResult = {
    values: Value[];
    size: number;
};
```

**Behavior**:
- Accepts `PropertyArray | null`
- Reads initial values from `propertyArray.getProperties().map(p => p.getValue())`
- Subscribes to 4 events: `onPropertyAdded`, `onPropertyRemoved`, `onPropertyValueChanged`, `onPropertyMoved`
- On any event: re-reads ALL values from PropertyArray (source of truth)
- Unsubscribes in useEffect cleanup using `unPropertyAdded`, etc.
- When null: returns `{ values: [], size: 0 }`

**Event subscription pattern**:
```typescript
useEffect(() => {
    if (!propertyArray) return;

    const handler = () => {
        setResult({
            values: propertyArray.getProperties().map(p => p.getValue()),
            size: propertyArray.getSize(),
        });
    };

    propertyArray.onPropertyAdded(handler);
    propertyArray.onPropertyRemoved(handler);
    propertyArray.onPropertyValueChanged(handler);
    propertyArray.onPropertyMoved(handler);

    return () => {
        propertyArray.unPropertyAdded(handler);
        propertyArray.unPropertyRemoved(handler);
        propertyArray.unPropertyValueChanged(handler);
        propertyArray.unPropertyMoved(handler);
    };
}, [propertyArray]);
```

### 1.2 Create `useInputTypeDescriptor` hook

**File**: `form2/hooks/useInputTypeDescriptor.ts`

Resolves descriptor and parses config for a given Input.

```typescript
type UseInputTypeDescriptorResult<C extends InputTypeConfig = InputTypeConfig> = {
    descriptor: InputTypeDescriptor<C>;
    config: C;
} | undefined;
```

**Behavior**:
- Accepts `input: Input`
- `DescriptorRegistry.get(input.getInputType().getName())` → descriptor
- `descriptor.readConfig(input.getInputTypeConfig())` → typed config
- Memoized by `input` reference via `useMemo`
- Returns `undefined` if descriptor not found (type not registered)

### 1.3 Export from form2

**File**: `form2/hooks/index.ts` (create or update)

Export both hooks. Update `form2/index.ts` barrel to include new hooks.

### 1.4 Tests

- `usePropertyArray.test.ts` — null input, initial values, event-driven updates
- `useInputTypeDescriptor.test.ts` — known type, unknown type, config parsing

---

## Phase 2: Form Rendering Pipeline (CS v6)

**Goal**: Build the rendering pipeline components. No data editing yet — read-only display of initial form data.

**Location**: `v6/features/shared/form/` (new directory)

### 2.1 Create FormRenderContext

**File**: `v6/features/shared/form/FormRenderContext.tsx`

React context providing shared form state to all descendants.

```typescript
type FormRenderContextValue = {
    enabled: boolean;
    // Future: language, formState, validation config
};
```

Minimal for now. Expanded later for validation, language, etc.

### 2.2 Create FormRenderer

**File**: `v6/features/shared/form/FormRenderer.tsx`

Top-level component. Iterates `form.getFormItems()`, renders FormItemRenderer for each.

```typescript
type FormRendererProps = {
    form: Form;
    data: PropertySet;      // mutable draft root (or sub-set for nested)
    enabled: boolean;
};
```

**Behavior**:
- Wraps children in `FormRenderContextProvider`
- Maps `form.getFormItems()` → `<FormItemRenderer>` per item
- Each FormItemRenderer receives `parentData={data}`

> **i18n**: form2's `I18nContext` defaults to lib-admin-ui's global `i18n` function, which reads from the same `Messages` store as CS v6's `useI18n`. No explicit `I18nProvider` wrapper needed.

### 2.3 Create FormItemRenderer

**File**: `v6/features/shared/form/FormItemRenderer.tsx`

Dispatches FormItem to the correct view using `ObjectHelper.iFrameSafeInstanceOf`.

```typescript
type FormItemRendererProps = {
    formItem: FormItem;
    parentData: PropertySet;
    parentPath?: PropertyPath;
};
```

**Dispatch table**:
- `Input` → `<InputField>`
- `FieldSet` → `<FieldSetView>`
- `FormItemSet` → `<ItemSetView>` (placeholder)
- `FormOptionSet` → `<OptionSetView>` (placeholder)

Import all form item classes from lib-admin-ui:
```typescript
import { Input } from '@enonic/lib-admin-ui/form/Input';
import { FieldSet } from '@enonic/lib-admin-ui/form/FieldSet';
import { FormItemSet } from '@enonic/lib-admin-ui/form/set/itemset/FormItemSet';
import { FormOptionSet } from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import { ObjectHelper } from '@enonic/lib-admin-ui/ObjectHelper';
```

### 2.4 Create InputField (split architecture)

InputField is split into two components to handle unregistered types without breaking the rules of hooks.

#### InputField (dispatcher)

**File**: `v6/features/shared/form/InputField.tsx`

```typescript
type InputFieldProps = {
    input: Input;
    parentData: PropertySet;
    parentPath?: PropertyPath;
    enabled: boolean;
};
```

**Implementation**:
1. `useInputTypeDescriptor(input)` → `{ descriptor, config }` or `undefined`
2. If `undefined` (type not registered): render label + `<UnsupportedInput>`. No other hooks needed.
3. If resolved: render `<ResolvedInputField>` with descriptor and config as props.

This split ensures CS-specific types without descriptors (Phases 2-5) render cleanly as UnsupportedInput without crashing on missing descriptor/config.

#### ResolvedInputField (full hook chain)

**File**: `v6/features/shared/form/ResolvedInputField.tsx`

Only rendered when descriptor is available. Has the full hook chain.

```typescript
type ResolvedInputFieldProps = InputFieldProps & {
    descriptor: InputTypeDescriptor;
    config: InputTypeConfig;
};
```

**Implementation**:
1. Get or create PropertyArray (see below)
2. `usePropertyArray(propertyArray)` → `{ values, size }`
3. `useOccurrenceManager({ occurrences, descriptor, config, initialValues: values })`
4. Sync: `useEffect(() => { occurrence.sync(values); }, [values, occurrence])` — keeps OccurrenceManager derived from PropertyArray
5. `ComponentRegistry.get(inputTypeName) ?? UnsupportedInput` → Component
6. Render: Label, help text, `<OccurrenceList>`, validation summary

#### PropertyArray creation + fill-to-minimum (eager, synchronous)

`parentData.getPropertyArray(input.getName())` returns `undefined` for fields without data (new content). Create it eagerly AND fill to minimum in the same `useMemo` — synchronously, before the first render, to avoid a flash of empty state.

For non-multiple inputs (`max=1`), always fill to at least 1 so the bare input renders immediately — matching legacy behavior where single-optional fields (min=0, max=1) show one empty input with no add/remove buttons.

```typescript
const propertyArray = useMemo(() => {
    let array = parentData.getPropertyArray(input.getName());
    if (!array) {
        array = PropertyArray.create()
            .setParent(parentData)
            .setName(input.getName())
            .setType(descriptor.getValueType())
            .build();
        parentData.addPropertyArray(array);
    }
    // Always show at least 1 input — matches legacy showEmptyFormItemOccurrences()
    const minFill = Math.max(input.getOccurrences().getMinimum(), 1);
    while (array.getSize() < minFill) {
        array.add(descriptor.getValueType().newNullValue());
    }
    return array;
}, [parentData, input, descriptor]);
```

> **Architecture principle**: PropertyArray is the single source of truth. OccurrenceManager is always derived via `sync(values)`. See Phase 4.1 for mutation handlers.
>
> **Why synchronous fill**: `useEffect` runs after render, causing a flash where OccurrenceList sees 0 values and renders an empty container (or add button) on the first frame. Doing it in `useMemo` guarantees the correct state on the first render. Do NOT put fill logic in a separate `useEffect`.

### 2.5 Create FieldSetView

**File**: `v6/features/shared/form/FieldSetView.tsx`

Simple wrapper: label + recursive rendering of children.

```typescript
type FieldSetViewProps = {
    fieldSet: FieldSet;
    parentData: PropertySet;
    parentPath?: PropertyPath;
};
```

**Behavior**: Renders label (if set), then maps `fieldSet.getFormItems()` → `<FormItemRenderer>` for each. Same `parentData` passes through (FieldSet doesn't create new PropertySet scope).

### 2.6 Create ItemSetView (placeholder)

**File**: `v6/features/shared/form/ItemSetView.tsx`

Placeholder showing "FormItemSet — not yet supported".

### 2.7 Create OptionSetView (placeholder)

**File**: `v6/features/shared/form/OptionSetView.tsx`

Placeholder showing "FormOptionSet — not yet supported".

### 2.8 Create types.ts

**File**: `v6/features/shared/form/types.ts`

Shared type definitions for form rendering (FormRenderContextValue, etc.).

### 2.9 Create barrel export

**File**: `v6/features/shared/form/index.ts`

Export FormRenderer and FormRenderContext for use by ContentDataView and MixinView.

---

## Phase 3: Wire Into Wizard + Store Changes

**Goal**: Connect FormRenderer to ContentDataView and MixinView. Update stores.

### 3.1 Call `initBuiltInTypes()`

Register all 14 descriptors + TextLine/TextArea components into registries.

**Where**: Bottom of `v6/features/store/app.store.ts` — runs once at module load time, before any wizard mounts. `ContentAppContainer` is legacy code and no longer the right entry point for v6 initialization.

```typescript
// v6/features/store/app.store.ts

//
// * App-wide initializations
//

initBuiltInTypes();
// Phase 6: registerCSTypes() will be added here too
```

This guarantees registration before any FormRenderer mount.

### 3.2 Rewrite ContentDataView / ContentForm

**File**: `v6/.../content-wizard-tabs/ContentDataView.tsx` and `ContentForm.tsx`

Replace current implementation with:
```typescript
const ContentForm = () => {
    const contentType = useStore($contentType);
    const draftData = useStore($wizardDraftData);

    if (!contentType || !draftData) return null;

    return (
        <div className="flex flex-col gap-7.5">
            <DisplayNameInput />
            <FormRenderer
                form={contentType.getForm()}
                data={draftData.getRoot()}
                enabled={true}
            />
        </div>
    );
};
```

### 3.3 Rewrite MixinView

**File**: `v6/.../content-wizard-tabs/MixinView.tsx`

Each mixin renders its own FormRenderer with the mixin's data PropertySet:
```typescript
const MixinView = ({ mixinName }) => {
    const mixinDescriptor = /* find by name from $mixinsDescriptors */;
    const mixinData = /* find mixin's PropertyTree from $wizardDraftMixins */;

    return (
        <FormRenderer
            form={mixinDescriptor.toForm()}
            data={mixinData.getRoot()}
            enabled={true}
        />
    );
};
```

### 3.4 Store changes

**File**: `v6/features/store/wizardContent.store.ts`

Keep `$wizardDataVersion` counter (not replace with boolean). Wire PropertyTree.onChanged to bump it. The existing `$wizardDataChanged` computed already does deep comparison via `dataTreesEqual()` — the counter just triggers recomputation after in-place PropertyTree mutations.

**Subscription lifecycle**: Use `$wizardDraftData.subscribe()` to track tree replacement (e.g., after save). Attach `onChanged` to each new tree, detach from the old one:

```typescript
let cleanupTreeListener: (() => void) | null = null;

$wizardDraftData.subscribe((tree) => {
    cleanupTreeListener?.();
    cleanupTreeListener = null;

    if (tree) {
        const handler = () => {
            $wizardDataVersion.set($wizardDataVersion.get() + 1);
        };
        tree.onChanged(handler);
        cleanupTreeListener = () => tree.getRoot().unChanged(handler);
    }
});
```

This ensures: (1) no listener leak when `setPersistedContent()` replaces the draft tree, (2) new trees always get a listener, (3) dirty tracking works correctly after save.

- Keep `$wizardDraftData` and `$wizardPersistedData` atoms unchanged
- `$wizardSectionChanges` continues to depend on `$wizardDataVersion` + deep comparison

**Do NOT remove yet**: Keep `$wizardDataChangedPaths`, `getDraftStringByPath`, etc. until all consumers are migrated. Remove in Phase 9.

### 3.5 Verify no regressions

After confirming new rendering works, verify old files are no longer imported by new code. **Do NOT delete old files yet** — they remain as dead code until Phase 9 cleanup. This is safe: `wizardMixinData.store.ts` still imports `FormDataContextValue` type, and other consumers may exist.

---

## Phase 4: Editing Support

**Goal**: Enable form editing. User changes propagate to PropertyTree.

### 4.1 ResolvedInputField mutation handlers

**Architecture: PropertyArray as single source of truth.** All mutations go through PropertyArray only. OccurrenceManager is never directly mutated — it stays in sync via `usePropertyArray` → `occurrence.sync(values)` (set up in Phase 2.4).

The flow per mutation:
1. Handler calls PropertyArray method
2. PropertyArray fires event synchronously
3. `usePropertyArray` handler reads new values, calls `setState`
4. React renders with new values
5. `useEffect` syncs OccurrenceManager via `occurrence.sync(values)`
6. Second render with updated occurrence state (IDs, validation, canAdd/canRemove)

```typescript
const handleChange = useCallback((index: number, value: Value) => {
    propertyArray.set(index, value);
}, [propertyArray]);

const handleAdd = useCallback(() => {
    if (!occurrence.state.canAdd) return;
    const defaultValue = descriptor.createDefaultValue(undefined);
    propertyArray.add(defaultValue);
}, [propertyArray, occurrence.state.canAdd, descriptor]);

const handleRemove = useCallback((index: number) => {
    if (!occurrence.state.canRemove) return;
    propertyArray.remove(index);
}, [propertyArray, occurrence.state.canRemove]);

const handleMove = useCallback((from: number, to: number) => {
    propertyArray.move(from, to);
}, [propertyArray]);
```

> **Why not dual-write?** PropertyArray.remove() throws on invalid index while OccurrenceManager.remove() silently no-ops. Dual-write creates divergence risk on every mutation. Single source of truth eliminates this entire class of bugs. Two renders per mutation is acceptable — both happen within the same frame.

### 4.2 Dirty tracking

Already set up in Phase 3.4 via `$wizardDraftData.subscribe()`. The subscription automatically handles tree replacement after save — no additional wiring needed here.

### 4.3 Save flow integration

Ensure the wizard's save routine reads from `$wizardDraftData.get()` to get the modified PropertyTree. The old `assembleViewedContent()` in ContentWizardPanel should use the draft PropertyTree.

---

## Phase 5: Remaining Generic Components (lib-admin-ui)

**Goal**: Build React components for the 12 remaining generic input types.

Each component follows the same pattern as TextLineInput/TextAreaInput:
- Receives `InputTypeComponentProps<SpecificConfig>`
- Uses `@enonic/ui` components for rendering
- Registered via `ComponentRegistry.register()`

### 5.1 Simple types (use `@enonic/ui` Input/Checkbox/etc.)

| Component | Enonic UI | Config | Priority |
|-----------|-----------|--------|----------|
| `CheckboxInput` | `Checkbox` | CheckboxConfig (alignment) | High |
| `LongInput` | `Input` type="number" | NumberConfig (min, max) | High |
| `DoubleInput` | `Input` type="number" | NumberConfig (min, max) | High |
| `RadioButtonInput` | `RadioGroup` | RadioButtonConfig (options) | High |
| `ComboBoxInput` | `Combobox` | ComboBoxConfig (options) | High |

### 5.2 Date/time types

| Component | Enonic UI | Config | Priority |
|-----------|-----------|--------|----------|
| `DateInput` | `DatePicker` | DateConfig | Medium |
| `TimeInput` | `TimePicker` | TimeConfig | Medium |
| `DateTimeInput` | `DatePicker` + `TimePicker` | DateTimeConfig (useTimezone) | Medium |
| `InstantInput` | `DatePicker` + `TimePicker` + TZ | InstantConfig | Medium |
| `DateTimeRangeInput` | 2x (DatePicker + TimePicker) | DateTimeRangeConfig | Medium |

### 5.3 Complex types

| Component | Enonic UI | Config | Priority |
|-----------|-----------|--------|----------|
| `GeoPointInput` | 2x `Input` (lat/lon) | GeoPointConfig | Low |
| `PrincipalSelectorInput` | `Combobox` + API | PrincipalSelectorConfig | Low |

### 5.4 Update initBuiltInComponents

Register all new components in `initBuiltInComponents.ts`.

### 5.5 Tests and stories

Each component needs:
- Unit test (`.test.ts`)
- Storybook story (`.stories.tsx`)

---

## Phase 6: CS-Specific Input Types

**Goal**: Build React components for Content Studio's 11 custom input types.

**Location**: `v6/features/shared/form/input-types/`

These components need CS-specific APIs (content service, media service, etc.) and are registered into ComponentRegistry during app init.

| Component | Old Class | Priority | Complexity |
|-----------|-----------|----------|------------|
| `TagInput` | Tag | High | Low |
| `ContentSelectorInput` | ContentSelector | High | High |
| `MediaSelectorInput` | MediaSelector | High | High |
| `ImageSelectorInput` | ImageSelector | High | High |
| `CustomSelectorInput` | CustomSelector | Medium | Medium |
| `ContentTypeFilterInput` | ContentTypeFilter | Medium | Medium |
| `SiteConfiguratorInput` | SiteConfigurator | Medium | High |
| `ImageUploaderInput` | ImageUploader | Medium | High |
| `MediaUploaderInput` | MediaUploader | Medium | High |
| `AttachmentUploaderInput` | AttachmentUploader | Medium | High |
| `HtmlAreaInput` | HtmlArea | Low (last) | Very High |

### 6.1 Registration

**File**: `v6/features/shared/form/input-types/index.ts`

```typescript
import { ComponentRegistry } from '@enonic/lib-admin-ui/form2';

ComponentRegistry.register('ContentSelector', ContentSelectorInput);
ComponentRegistry.register('HtmlArea', HtmlAreaInput);
// ... all 11
```

Called during CS app init, after `initBuiltInTypes()`.

### 6.2 CS-specific descriptors

Most CS types use the 14 generic descriptors from form2 for occurrence validation. Some need custom descriptors for CS-specific config parsing:

| Type | Needs Custom Descriptor | Reason |
|------|------------------------|--------|
| ContentSelector | Likely | Content type filtering, tree mode config |
| ImageSelector | Likely | Allowed content types, image crop config |
| HtmlArea | Yes | Toolbar config, macro config, allowed styles |
| SiteConfigurator | Yes | App config schema, nested form rendering |
| Tag | Maybe | Tag suggestion source config |
| Others | Unlikely | Standard config suffices |

**File**: `v6/features/shared/form/input-types/descriptors/`

Create alongside React components. Register into DescriptorRegistry during app init (see Phase 3.1).

---

## Phase 7: Nested Structures

**Goal**: Replace placeholder views with full implementations.

### 7.1 ItemSetView (FormItemSet)

Repeatable group. Each occurrence = PropertySet within PropertyArray.

```
parentData.getPropertyArray("myItemSet") → PropertyArray of PropertySets
    [0] → PropertySet { field1, field2, ... }
    [1] → PropertySet { field1, field2, ... }
```

**Implementation**:
- Use `usePropertyArray` on the ItemSet's PropertyArray
- Use `useOccurrenceManager` for occurrence count
- Each occurrence recursively renders `<FormRenderer>` with its PropertySet as `data`
- Add/remove creates/destroys PropertySets

### 7.2 OptionSetView (FormOptionSet)

Radio/checkbox selection of named option groups.

**Implementation**:
- Render option selector (radio for single, checkbox for multi)
- Selected option(s) render their nested form items via `<FormRenderer>`
- Selection state stored in PropertySet (_selected property)

> **Container-level validation**: OptionSet constraints ("at least one option selected", "exactly N options") operate at the container level, not per-input. OccurrenceManager cannot express this — OptionSetView needs its own validation logic, wired to Phase 8's validation pipeline.

---

## Phase 8: Validation Integration

**Goal**: Full validation pipeline wired to wizard save/publish flow.

### 8.1 Per-field validation

Already handled by OccurrenceManager via descriptors. Each InputField reports validity through its occurrence state.

### 8.2 Form-level validation

**Strategy**: Walk PropertyTree + Form schema synchronously on save/publish.

- Iterate all form items in the schema
- For each Input: resolve descriptor, get PropertyArray values, run `descriptor.validate()` on each value, check occurrence count against min/max
- For OptionSet: validate container-level constraints (selection count)
- Aggregate all validation results into a form-level validity state
- This is the authoritative validation — OccurrenceManager provides inline UX during editing, but the schema walk is the source of truth

This matches the existing Enonic pattern (old wizard validates by walking the tree). It's deterministic, testable without rendering, and handles all validation types including container-level constraints.

### 8.3 Wizard integration

- Wire form validity to wizard save/publish buttons
- Show validation errors on publish attempt
- Block publish if form invalid

---

## Phase 9: Cleanup

**Goal**: Remove all superseded code.

### 9.1 Remove from CS v6

Old form rendering (deferred from Phase 3):
- `FormInputView.tsx`
- `FormInputFactory.tsx`
- `TextLineInput.tsx` (CS version)
- `TextAreaInput.tsx` (CS version)
- `formOccurrences.ts`
- `FormUnsupportedView.tsx`
- `FormFieldSetView.tsx`

Old data layer:
- `FormDataContext.tsx` (replaced by FormRenderContext)
- `wizardPropertyTree.utils.ts` (PropertyArray handles mutations)
- `$wizardDataChangedPaths` store atom
- `getDraftStringByPath` / `setDraftStringByPath` store actions
- `addDraftStringOccurrenceByPath` / `removeDraftStringOccurrenceByPath` store actions
- Update `wizardMixinData.store.ts` to remove `FormDataContextValue` import

### 9.2 Verify

- All 25 input types render correctly
- All form structures (FieldSet, ItemSet, OptionSet) work
- Editing, validation, save, publish all functional
- No references to removed code

---

## File Map

### lib-admin-ui — New Files

```
form2/hooks/
├── usePropertyArray.ts          # Phase 1
├── usePropertyArray.test.ts     # Phase 1
├── useInputTypeDescriptor.ts    # Phase 1
├── useInputTypeDescriptor.test.ts # Phase 1
└── index.ts                     # Phase 1 (update)

form2/components/                # Phase 5 (12 new components)
├── checkbox-input/
├── long-input/
├── double-input/
├── radio-button-input/
├── combobox-input/
├── date-input/
├── time-input/
├── date-time-input/
├── instant-input/
├── date-time-range-input/
├── geo-point-input/
└── principal-selector-input/
```

### CS v6 — New Files

```
v6/features/shared/form/         # Phase 2-3
├── index.ts
├── types.ts
├── FormRenderContext.tsx
├── FormRenderer.tsx
├── FormItemRenderer.tsx
├── InputField.tsx               # Dispatcher (descriptor check)
├── ResolvedInputField.tsx       # Full hook chain
├── FieldSetView.tsx
├── ItemSetView.tsx              # Placeholder → Phase 7
├── OptionSetView.tsx            # Placeholder → Phase 7
└── input-types/                 # Phase 6
    ├── index.ts
    ├── content-selector/
    ├── media-selector/
    ├── image-selector/
    ├── custom-selector/
    ├── tag/
    ├── content-type-filter/
    ├── site-configurator/
    ├── html-area/
    ├── image-uploader/
    ├── media-uploader/
    └── attachment-uploader/
```

### CS v6 — Deleted Files (Phase 9)

All deletions deferred to Phase 9 to avoid risk during incremental migration.

```
v6/.../content-wizard-tabs/
├── FormInputView.tsx
├── FormInputFactory.tsx
├── TextLineInput.tsx
├── TextAreaInput.tsx
├── formOccurrences.ts
├── FormDataContext.tsx
├── FormUnsupportedView.tsx
└── FormFieldSetView.tsx
```

### CS v6 — Modified Files

```
v6/.../content-wizard-tabs/
├── ContentForm.tsx              # Phase 3 (rewrite)
├── ContentDataView.tsx          # Phase 3 (simplify)
└── MixinView.tsx                # Phase 3 (rewrite)

v6/features/store/
└── wizardContent.store.ts       # Phase 3-4 (wire PropertyTree.onChanged)

v6/features/store/
└── app.store.ts                 # Phase 3 (add initBuiltInTypes call at module level)
```

---

## Dependencies Between Phases

```
Phase 1 (hooks)
    ↓
Phase 2 (pipeline) ← depends on Phase 1 hooks
    ↓
Phase 3 (wire up) ← depends on Phase 2 components
    ↓
Phase 4 (editing) ← depends on Phase 3 wiring
    ↓
Phase 5 (generic types)  ← can start after Phase 4
Phase 6 (CS types)       ← can start after Phase 4
Phase 7 (nested)         ← can start after Phase 4
Phase 8 (validation)     ← depends on Phases 5-7
    ↓
Phase 9 (cleanup) ← depends on all above
```

Phases 5, 6, and 7 can proceed in parallel after Phase 4.

---

## Key Design Decisions

Resolved from consilium critical review (4 critical, 7 warnings, 3 notes analyzed):

1. **PropertyArray is the single source of truth** — All mutations go through PropertyArray only. OccurrenceManager is derived via `sync(values)`, never mutated directly. Eliminates dual-write divergence risk (PropertyArray.remove throws, OccurrenceManager.remove no-ops). Two renders per mutation is acceptable.

2. **InputField split architecture** — InputField dispatches to UnsupportedInput (no hooks) or ResolvedInputField (full hook chain). Handles unregistered CS-specific types in Phases 2-5 without crashing on missing descriptor.

3. **Eager PropertyArray creation + synchronous fill** — Created and filled in the same `useMemo`, before the first render. Always fill to at least 1 (`Math.max(min, 1)`) regardless of occurrence config — the equivalent of legacy `FormItemOccurrences.showEmptyFormItemOccurrences()` which unconditionally created one empty occurrence for all Inputs. Do NOT use `useEffect` for filling: it runs after render, causing a flash of wrong state.

4. **$wizardDraftData.subscribe() for tree lifecycle** — Listener attaches to each new tree, detaches from old. Prevents leak after save/reset when PropertyTree is replaced.

5. **Keep $wizardDataVersion counter** — `$wizardDataChanged` already does deep comparison via `dataTreesEqual()`. Counter just triggers recomputation. No need for path-level tracking in Phases 3-4.

6. **All file deletions deferred to Phase 9** — Dead code has zero runtime cost. Eliminates risk of breaking non-wizard consumers during incremental migration.

7. **Form-level validation via schema walk** — Walk PropertyTree + Form schema synchronously on save/publish. OccurrenceManager provides inline UX. Schema walk is the authoritative source.

8. **initBuiltInTypes() in app.store.ts** — Runs at module load time, before any wizard mount. `ContentAppContainer` is legacy code and no longer the v6 entry point. CS-specific registration added here too.

9. **No i18n bridging needed** — form2's I18nContext defaults to lib-admin-ui's global `i18n` function, same Messages store as CS v6.

### Notes

- **usePropertyArray O(n)**: PropertyArray events don't bubble from nested PropertySets to parent arrays for value changes. Re-reading 1-10 values per input change is negligible. Optimize later if profiling shows issues.
- **UnsupportedInput window**: 23 types show as UnsupportedInput through Phases 2-5. Acceptable on feature branch (`epic-enonic-ui`).
- **lib-admin-ui fixes already applied (2026-02-26)**:
  - `OccurrenceList.tsx`: `isSingle` changed from `min === 1 && max === 1` to `!occurrences.multiple()`. Extends bare single-input rendering to `min=0, max=1` (single optional), matching legacy UX intent: max=1 always means "one slot", add/remove buttons never shown.
  - `useOccurrenceManager.ts`: Eager fill changed from `getMinimum()` to `Math.max(getMinimum(), 1)` unconditionally (all occurrence configs, not just non-multiple). Every Input always shows at least 1 empty field — matches legacy `showEmptyFormItemOccurrences()`.
  - `OccurrenceList.tsx`: Remove button guarded by `state.values.length > 1` in addition to `state.canRemove` (Option D). This keeps `canRemove()` as a pure data-model check (`count > min`) while the view applies the UX policy of never removing the last visible input — matching legacy `isRemoveButtonRequiredStrict()`. This separation preserves `canRemove()` semantics for future FormItemSet/OptionSet consumers (Phase 7).

---

## Missing from lib-admin-ui (Report)

Items referenced in the PRD but not yet in form2:

1. **12 React input components** — Only TextLine, TextArea, UnsupportedInput exist. CheckboxInput through PrincipalSelectorInput need building.
2. **usePropertyArray hook** — Does not exist. Needs to be created.
3. **useInputTypeDescriptor hook** — Does not exist. Needs to be created.
4. **hooks/index.ts barrel** — Only useOccurrenceManager is exported from hooks. Needs update.

Everything else referenced in the PRD exists and is functional:
- All 14 descriptors with validation and config parsing
- DescriptorRegistry and ComponentRegistry
- OccurrenceManager and useOccurrenceManager
- OccurrenceList with drag-and-drop
- I18nContext
- initBuiltInTypes
