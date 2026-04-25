import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import type {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {atom, batched, computed, map} from 'nanostores';
import type {Content} from '../../../app/content/Content';
import type {ContentName} from '../../../app/content/ContentName';
import type {ContentState} from '../../../app/content/ContentState';
import {ContentUnnamed} from '../../../app/content/ContentUnnamed';
import {Mixin} from '../../../app/content/Mixin';
import type {MixinDescriptor} from '../../../app/content/MixinDescriptor';
import {MixinName} from '../../../app/content/MixinName';
import {WorkflowState} from '../../../app/content/WorkflowState';
import type {ContentType} from '../../../app/inputtype/schema/ContentType';
import type {Page} from '../../../app/page/Page';
import {ContentDiffHelper} from '../../../app/util/ContentDiffHelper';
import {
    addStringOccurrence,
    removeStringOccurrence,
    setStringValue,
} from './wizardPropertyTree.utils';

//
// * Types
//

export type WizardChangeSection = 'data' | 'displayName' | 'name' | 'mixins' | 'page' | 'workflow';

// Record<propertyPath, errorMessages[]>
// propertyPath uses dot-notation: "myField", "myGroup.myField"
export type FormDataValidation = Record<string, string[]>;

export type WizardSectionChanges = {
    data: boolean;
    displayName: boolean;
    name: boolean;
    mixins: boolean;
    page: boolean;
    workflow: boolean;
};

type WizardTrackedField<T> = {
    persisted: ReturnType<typeof atom<T>>;
    draft: ReturnType<typeof atom<T>>;
};

type WizardPersistedSectionsSnapshot = {
    displayName: string;
    name: ContentName | null;
    data: PropertyTree | null;
    mixins: Mixin[];
    page: Page | null;
    workflow: WorkflowState | null;
};

const BASE_URL_INPUT_PROP = 'baseUrl';

const LEGACY_BASE_URL_INPUT_PROP = 'portalBaseUrl';

const SITE_CONFIG_PROP = 'siteConfig';

const APPLICATION_KEY_PROP = 'applicationKey';

const CONFIG_PROP = 'config';

const PORTAL_APPLICATION_KEY = ApplicationKey.PORTAL.toString();

const WIZARD_FORM_VALIDATION_KEY = '__wizardForm';

//
// * State
//

function createTrackedField<T>(persistedInitial: T, draftInitial: T = persistedInitial): WizardTrackedField<T> {
    return {
        persisted: atom<T>(persistedInitial),
        draft: atom<T>(draftInitial),
    };
}

const wizardTrackedState = {
    displayName: createTrackedField<string>('', ''),
    name: createTrackedField<ContentName | null>(null, null),
    mixins: createTrackedField<Mixin[]>([], []),
    page: createTrackedField<Page | null>(null, null),
    workflow: createTrackedField<WorkflowState | null>(null, null),
};

export const $wizardPersistedDisplayName = wizardTrackedState.displayName.persisted;

export const $wizardDraftDisplayName = wizardTrackedState.displayName.draft;

export const $wizardPersistedName = wizardTrackedState.name.persisted;

export const $wizardDraftName = wizardTrackedState.name.draft;

export const $wizardPersistedData = atom<PropertyTree | null>(null);

export const $wizardDraftData = atom<PropertyTree | null>(null);

export const $wizardDataChangedPaths = map<Record<string, number>>({});

export const $wizardDataVersion = atom<number>(0);

const $needsRenderedSnapshot = atom<boolean>(false);

// Mixins that have not yet mounted and may need snapshotting when they do.
// Populated at init, entries removed when the mixin tab mounts.
const $mixinsPendingMount = atom<Set<string>>(new Set());

// Mixins whose tab has mounted and whose snapshot window is open.
// Entries are added by notifyMixinMounted and removed by snapshotMixinBaseline
// or by a per-mixin auto-disarm timeout.
const $mixinsNeedingSnapshot = atom<Set<string>>(new Set());

export const $wizardPersistedMixins = wizardTrackedState.mixins.persisted;

export const $wizardDraftMixins = wizardTrackedState.mixins.draft;

export const $wizardMixinsVersion = atom<number>(0);

export const $wizardPersistedPage = wizardTrackedState.page.persisted;

export const $wizardDraftPage = wizardTrackedState.page.draft;

export const $wizardPersistedWorkflowState = wizardTrackedState.workflow.persisted;

export const $wizardDraftWorkflowState = wizardTrackedState.workflow.draft;

export const $contentType = atom<ContentType | null>(null);

export const $mixinsDescriptors = atom<MixinDescriptor[]>([]);

export const $wizardDataValidation = map<FormDataValidation>({});

export const $isContentFormExpanded = atom<boolean>(true);

export const $wizardReadOnly = atom<boolean>(true);

export const $displayNameInputFocusRequested = atom<boolean>(false);

//
// * Derived
//

export const $displayName = $wizardDraftDisplayName;

export const $hasPage = computed($wizardDraftPage, (page) => page != null);

export const $contentTypeDisplayName = computed($contentType, (contentType) => contentType?.getTitle() ?? '');

const $wizardDataChanged = computed(
    [$wizardPersistedData, $wizardDraftData, $wizardDataVersion],
    (persistedData, draftData): boolean => {
        return !dataTreesEqual(persistedData, draftData);
    },
);

const $wizardDisplayNameChanged = computed(
    [$wizardPersistedDisplayName, $wizardDraftDisplayName],
    (persistedDisplayName, draftDisplayName): boolean => persistedDisplayName !== draftDisplayName,
);

const $wizardNameChanged = computed(
    [$wizardPersistedName, $wizardDraftName],
    (persistedName, draftName): boolean => !contentNamesEqual(persistedName, draftName),
);

const $wizardMixinsChanged = computed(
    [$wizardPersistedMixins, $wizardDraftMixins, $wizardMixinsVersion],
    (persistedMixins, draftMixins): boolean => !mixinsEqual(persistedMixins, draftMixins),
);

const $wizardPageChanged = computed(
    [$wizardPersistedPage, $wizardDraftPage],
    (persistedPage, draftPage): boolean => persistedPage ? !persistedPage.equals(draftPage) : !!draftPage,
);

const $wizardWorkflowChanged = computed(
    [$wizardPersistedWorkflowState, $wizardDraftWorkflowState],
    (persistedWorkflowState, draftWorkflowState): boolean => persistedWorkflowState !== draftWorkflowState,
);

export const $wizardSectionChanges = computed(
    [
        $wizardDataChanged,
        $wizardDisplayNameChanged,
        $wizardNameChanged,
        $wizardMixinsChanged,
        $wizardPageChanged,
        $wizardWorkflowChanged,
    ],
    (
        data,
        displayName,
        name,
        mixins,
        page,
        workflow,
    ): WizardSectionChanges => {
        return {data, displayName, name, mixins, page, workflow};
    },
);

export const $wizardChangedSections = computed($wizardSectionChanges, (sections): WizardChangeSection[] => {
    return (Object.keys(sections) as WizardChangeSection[]).filter((section) => sections[section]);
});

export const $wizardHasChanges = computed($wizardSectionChanges, (sections): boolean => {
    return sections.data || sections.displayName || sections.name || sections.mixins || sections.page || sections.workflow;
});

// Like $wizardHasChanges but excludes workflow changes. Used by $wizardContentState to avoid
// circular dependency: contentState subscriber → setWizardMarkedAsReady → workflow change → hasChanges → contentState.
const $wizardHasContentChanges = computed($wizardSectionChanges, (sections): boolean => {
    return sections.data || sections.displayName || sections.name || sections.mixins || sections.page;
});

export const $wizardIsMarkedAsReady = computed($wizardDraftWorkflowState, (state): boolean => {
    return state === WorkflowState.READY;
});

type CreateContentStateParams = {
    displayName: string;
    name: ContentName | null;
    draftWorkflowState: WorkflowState | null;
    validation: FormDataValidation;
};

function hasDataValidationErrors(validation: FormDataValidation): boolean {
    return Object.values(validation).some((messages) => Array.isArray(messages) && messages.length > 0);
}

function hasValidDisplayName(displayName: string): boolean {
    return displayName.trim().length > 0;
}

function hasValidName(name: ContentName | null): boolean {
    const raw = name?.toString()?.trim() ?? '';

    return raw.length > 0 && !raw.startsWith(ContentUnnamed.UNNAMED_PREFIX);
}

export function createContentState({
    displayName,
    name,
    draftWorkflowState,
    validation,
}: CreateContentStateParams): ContentState | null {
    if (draftWorkflowState == null) {
        return null;
    }

    if (!hasValidDisplayName(displayName) || !hasValidName(name)) {
        return 'invalid';
    }

    if (hasDataValidationErrors(validation)) {
        return 'invalid';
    }

    if (draftWorkflowState === WorkflowState.READY) {
        return 'ready';
    }

    return 'in-progress';
}

export const $wizardContentState = batched(
    [$wizardDraftDisplayName, $wizardDraftName, $wizardDraftWorkflowState, $wizardDataValidation],
    (displayName, name, draftWorkflowState, validation): ContentState | null => {
        return createContentState({
            displayName,
            name,
            draftWorkflowState,
            validation,
        });
    },
);

// Downgrade READY → IN_PROGRESS when content is edited, restore when reverted.
// Separate from $wizardContentState to avoid circular dependency.
$wizardHasContentChanges.subscribe((hasChanges) => {
    const persisted = $wizardPersistedWorkflowState.get();
    const draft = $wizardDraftWorkflowState.get();

    if (hasChanges && draft === WorkflowState.READY) {
        setDraftWorkflowState(WorkflowState.IN_PROGRESS);
    } else if (!hasChanges && persisted === WorkflowState.READY && draft === WorkflowState.IN_PROGRESS) {
        setDraftWorkflowState(WorkflowState.READY);
    }
});

export type MixinTabInfo = {
    name: string;
    title: string;
};

export const $enabledMixinsNames = computed(
    [$wizardDraftMixins, $mixinsDescriptors],
    (mixins, schemas): Set<string> => {
        const enabledMixinNames = new Set(mixins.map((mixin) => mixin.getName().toString()));
        const enabledNames = new Set<string>();

        for (const schema of schemas) {
            const name = schema.getName();
            if (!schema.isOptional() || enabledMixinNames.has(name)) {
                enabledNames.add(name);
            }
        }

        return enabledNames;
    },
);

export const $mixinsTabs = computed([$enabledMixinsNames, $mixinsDescriptors], (enabledNames, schemas): MixinTabInfo[] => {
    return schemas
        .filter((schema) => enabledNames.has(schema.getName()))
        .map((schema) => ({
            name: schema.getName(),
            title: schema.getTitle() ?? schema.getName(),
        }));
});

export type MixinMenuItem = {
    name: string;
    displayName: string;
    isOptional: boolean;
    isEnabled: boolean;
};

export const $mixinsMenuItems = computed([$mixinsDescriptors, $enabledMixinsNames], (schemas, enabledNames): MixinMenuItem[] => {
    return schemas.map((schema) => ({
        name: schema.getName(),
        displayName: schema.getTitle() ?? schema.getName(),
        isOptional: schema.isOptional(),
        isEnabled: enabledNames.has(schema.getName()),
    }));
});

//
// * Helpers
//

function clonePropertyTree(tree: PropertyTree | null): PropertyTree | null {
    return tree ? tree.copy() : null;
}

function dataTreesEqual(a: PropertyTree | null, b: PropertyTree | null): boolean {
    if (!a || !b) {
        return a === b;
    }

    return ContentDiffHelper.dataEquals(a, b, false);
}

function getPortalSiteConfigBaseUrl(data: PropertyTree): string | null {
    const portalSiteConfig = data
        .getPropertySets(SITE_CONFIG_PROP)
        .find((siteConfig) => siteConfig.getString(APPLICATION_KEY_PROP) === PORTAL_APPLICATION_KEY);
    const baseUrl = portalSiteConfig?.getPropertySet(CONFIG_PROP)?.getString(BASE_URL_INPUT_PROP);

    return baseUrl ?? null;
}

function injectSiteBaseUrlBridge(data: PropertyTree | null, content: Content): PropertyTree | null {
    if (!data || content.getType()?.isSite() !== true) {
        return data;
    }

    const root = data.getRoot();
    const baseUrl = getPortalSiteConfigBaseUrl(data);

    if (root.getPropertyArray(LEGACY_BASE_URL_INPUT_PROP)?.getSize() > 0) {
        data.removeProperty(LEGACY_BASE_URL_INPUT_PROP, 0);
    }

    if (baseUrl != null && baseUrl.trim().length > 0) {
        data.setString(BASE_URL_INPUT_PROP, 0, baseUrl);
    } else {
        data.setProperty(BASE_URL_INPUT_PROP, 0, ValueTypes.STRING.newNullValue());
    }

    return data;
}

function bumpDraftDataVersion(): void {
    $wizardDataVersion.set($wizardDataVersion.get() + 1);
}

function bumpMixinsVersion(): void {
    $wizardMixinsVersion.set($wizardMixinsVersion.get() + 1);
}

function cloneMixins(mixins: Mixin[]): Mixin[] {
    return mixins.map((mixin) => mixin.clone());
}

function clonePage(page: Page | null): Page | null {
    return page ? page.clone() : null;
}

function contentNamesEqual(a: ContentName | null, b: ContentName | null): boolean {
    if (!a || !b) {
        return a === b;
    }

    return a.equals(b);
}

function mixinsEqual(a: Mixin[], b: Mixin[]): boolean {
    if (a.length !== b.length) {
        return false;
    }

    const sortedA = [...a].sort((left, right) => left.getName().toString().localeCompare(right.getName().toString()));
    const sortedB = [...b].sort((left, right) => left.getName().toString().localeCompare(right.getName().toString()));

    for (let i = 0; i < sortedA.length; i += 1) {
        const leftMixin = sortedA[i];
        const rightMixin = sortedB[i];

        if (leftMixin.getName().toString() !== rightMixin.getName().toString()) {
            return false;
        }

        if (!ContentDiffHelper.dataEquals(leftMixin.getData(), rightMixin.getData(), false)) {
            return false;
        }
    }

    return true;
}

function buildPersistedSectionsSnapshot(content: Content): WizardPersistedSectionsSnapshot {
    return {
        displayName: content.getDisplayName() ?? '',
        name: content.getName(),
        data: injectSiteBaseUrlBridge(clonePropertyTree(content.getContentData()), content),
        mixins: cloneMixins(content.getMixins()),
        page: clonePage(content.getPage()),
        workflow: content.getWorkflow()?.getState() ?? null,
    };
}

function applyPersistedSectionsSnapshot(snapshot: WizardPersistedSectionsSnapshot): void {
    $wizardPersistedDisplayName.set(snapshot.displayName);
    $wizardDraftDisplayName.set(snapshot.displayName);

    $wizardPersistedName.set(snapshot.name);
    $wizardDraftName.set(snapshot.name);

    $wizardPersistedData.set(snapshot.data);
    $wizardDraftData.set(snapshot.data ? snapshot.data.copy() : null);
    $wizardDataChangedPaths.set({});
    $wizardDataVersion.set(0);

    $wizardPersistedMixins.set(snapshot.mixins);
    $wizardDraftMixins.set(cloneMixins(snapshot.mixins));
    $wizardMixinsVersion.set(0);

    $wizardPersistedPage.set(snapshot.page);
    $wizardDraftPage.set(clonePage(snapshot.page));

    $wizardPersistedWorkflowState.set(snapshot.workflow);
    $wizardDraftWorkflowState.set(snapshot.workflow);
}

let contentDisarmTimer: ReturnType<typeof setTimeout> | null = null;
const mixinDisarmTimers = new Map<string, ReturnType<typeof setTimeout>>();

function armRenderedSnapshot(content: Content): void {
    if (contentDisarmTimer != null) {
        clearTimeout(contentDisarmTimer);
        contentDisarmTimer = null;
    }

    $needsRenderedSnapshot.set(true);

    // Mixins go into pending — they will be armed individually when their
    // lazy Tab.Content mounts and calls notifyMixinMounted().
    $mixinsPendingMount.set(new Set(content.getMixins().map((m) => m.getName().toString())));
    $mixinsNeedingSnapshot.set(new Set());
}

//
// * Actions
//

export function setWizardFormValidation(isValid: boolean): void {
    if (isValid) {
        $wizardDataValidation.setKey(WIZARD_FORM_VALIDATION_KEY, undefined);
        return;
    }

    $wizardDataValidation.setKey(WIZARD_FORM_VALIDATION_KEY, ['invalid']);
}

export function setPersistedContent(content: Content): void {
    applyPersistedSectionsSnapshot(buildPersistedSectionsSnapshot(content));
    $wizardDataValidation.set({});

    // After save, newly persisted mixins may not have been mounted yet.
    // Seed them into pending so their first lazy mount snapshots enrichment.
    const currentPending = $mixinsPendingMount.get();
    const mixinNames = content.getMixins().map((m) => m.getName().toString());
    const newPending = new Set(currentPending);
    for (const name of mixinNames) {
        if (!currentPending.has(name)) {
            newPending.add(name);
        }
    }
    if (newPending.size !== currentPending.size) {
        $mixinsPendingMount.set(newPending);
    }

    for (const callback of persistedContentSetCallbacks) {
        callback(content);
    }
}

const persistedContentSetCallbacks = new Set<(content: Content) => void>();

export function onWizardPersistedContentSet(callback: (content: Content) => void): () => void {
    persistedContentSetCallbacks.add(callback);
    return () => { persistedContentSetCallbacks.delete(callback); };
}

export function initializeWizardContentState(
    content: Content,
    contentType: ContentType | null,
    mixins: MixinDescriptor[],
    workflowState?: WorkflowState | null,
): void {
    setPersistedContent(content);
    $contentType.set(contentType);
    $mixinsDescriptors.set([...mixins]);

    if (workflowState != null) {
        $wizardPersistedWorkflowState.set(workflowState);
        $wizardDraftWorkflowState.set(workflowState);
    }

    armRenderedSnapshot(content);
}

export function setDraftDisplayName(value: string): void {
    if ($wizardDraftDisplayName.get() === value) {
        return;
    }

    $wizardDraftDisplayName.set(value);
}

export function setDraftName(value: ContentName): void {
    if (contentNamesEqual($wizardDraftName.get(), value)) {
        return;
    }

    $wizardDraftName.set(value);
}

export function getDraftStringByPath(path: PropertyPath): string {
    return $wizardDraftData.get()?.getString(path) ?? '';
}

export function setDraftStringByPath(path: PropertyPath, value: string): void {
    const draftData = $wizardDraftData.get();
    if (!draftData) {
        return;
    }

    const mutated = setStringValue(draftData, $wizardPersistedData.get(), $wizardDataChangedPaths, path, value);
    if (mutated) {
        bumpDraftDataVersion();
    }
}

export function addDraftStringOccurrenceByPath(path: PropertyPath, occurrenceIndex: number): void {
    const draftData = $wizardDraftData.get();
    if (!draftData) {
        return;
    }

    const mutated = addStringOccurrence(draftData, $wizardPersistedData.get(), $wizardDataChangedPaths, path, occurrenceIndex);
    if (mutated) {
        bumpDraftDataVersion();
    }
}

export function removeDraftStringOccurrenceByPath(path: PropertyPath, occurrenceIndex: number): void {
    const draftData = $wizardDraftData.get();
    if (!draftData) {
        return;
    }

    const mutated = removeStringOccurrence(draftData, $wizardPersistedData.get(), $wizardDataChangedPaths, path, occurrenceIndex);
    if (mutated) {
        bumpDraftDataVersion();
    }
}

export function setDraftMixins(value: Mixin[]): void {
    if (mixinsEqual($wizardDraftMixins.get(), value)) {
        return;
    }

    $wizardDraftMixins.set(cloneMixins(value));
}

export function setDraftPage(page: Page | null): void {
    const nextPage = clonePage(page);
    const currentPage = $wizardDraftPage.get();
    if (currentPage ? currentPage.equals(nextPage) : !nextPage) {
        return;
    }

    $wizardDraftPage.set(nextPage);
}

export function setDraftWorkflowState(state: WorkflowState | null): void {
    if ($wizardDraftWorkflowState.get() === state) {
        return;
    }

    $wizardDraftWorkflowState.set(state);
}

export function setWizardMarkedAsReady(ready: boolean): void {
    setDraftWorkflowState(ready ? WorkflowState.READY : WorkflowState.IN_PROGRESS);
}

export function setContentType(contentType: ContentType): void {
    $contentType.set(contentType);
}

export function setMixinsDescriptors(mixinsDescriptors: MixinDescriptor[]): void {
    $mixinsDescriptors.set(mixinsDescriptors);
}

export const setContentFormExpanded = (isExpanded: boolean): void => {
    $isContentFormExpanded.set(isExpanded);
};

export const toggleContentFormExpanded = (): void => {
    $isContentFormExpanded.set(!$isContentFormExpanded.get());
};

export function setWizardReadOnly(readOnly: boolean): void {
    if ($wizardReadOnly.get() === readOnly) {
        return;
    }

    $wizardReadOnly.set(readOnly);
}

export function requestDisplayNameInputFocus(): void {
    if ($displayNameInputFocusRequested.get()) {
        return;
    }

    $displayNameInputFocusRequested.set(true);
}

export function clearDisplayNameInputFocusRequest(): void {
    if (!$displayNameInputFocusRequested.get()) {
        return;
    }

    $displayNameInputFocusRequested.set(false);
}

export function notifyContentFormMounted(): void {
    if (!$needsRenderedSnapshot.get()) {
        return;
    }

    // Child InputField effects have already completed (React fires child
    // effects before parent effects), so enrichment is done. Schedule
    // snapshot to capture the enriched state immediately.
    queueMicrotask(() => {
        snapshotContentBaseline();
    });

    // Auto-disarm after render window closes, in case no enrichment
    // occurred and the snapshot was a no-op.
    if (contentDisarmTimer != null) {
        clearTimeout(contentDisarmTimer);
    }
    contentDisarmTimer = setTimeout(() => {
        contentDisarmTimer = null;
        $needsRenderedSnapshot.set(false);
    }, 0);
}

export function notifyMixinMounted(name: string): void {
    const pending = $mixinsPendingMount.get();
    if (!pending.has(name)) {
        return;
    }

    // Move from pending to armed
    const nextPending = new Set(pending);
    nextPending.delete(name);
    $mixinsPendingMount.set(nextPending);

    const needed = new Set($mixinsNeedingSnapshot.get());
    needed.add(name);
    $mixinsNeedingSnapshot.set(needed);

    // Child InputField effects have already completed (React fires child
    // effects before parent effects), so enrichment is done. Schedule
    // snapshot to capture the enriched state immediately.
    queueMicrotask(() => {
        snapshotMixinBaseline(name);
    });

    // Auto-disarm after render window closes, in case no enrichment
    // occurred and the snapshot was a no-op.
    const timer = setTimeout(() => {
        mixinDisarmTimers.delete(name);
        const current = $mixinsNeedingSnapshot.get();
        if (current.has(name)) {
            const next = new Set(current);
            next.delete(name);
            $mixinsNeedingSnapshot.set(next);
        }
    }, 0);
    mixinDisarmTimers.set(name, timer);
}

export function setDraftMixinEnabled(name: string, enabled: boolean): void {
    const mixinDescriptor = $mixinsDescriptors.get().find((descriptor) => descriptor.getName() === name);
    if (mixinDescriptor && !mixinDescriptor.isOptional()) {
        return;
    }

    const currentMixins = $wizardDraftMixins.get();
    const hasMixin = currentMixins.some((mixin) => mixin.getName().toString() === name);
    if (hasMixin === enabled) {
        return;
    }

    const nextMixins = enabled
        ? (() => {
            const persistedMixin = $wizardPersistedMixins.get().find((mixin) => mixin.getName().toString() === name);
            const mixinToAdd = persistedMixin ? persistedMixin.clone() : new Mixin(new MixinName(name), new PropertyTree());
            return [...currentMixins, mixinToAdd];
        })()
        : currentMixins.filter((mixin) => mixin.getName().toString() !== name);

    setDraftMixins(nextMixins);
}

const resetCallbacks = new Set<() => void>();

export function onWizardContentReset(callback: () => void): () => void {
    resetCallbacks.add(callback);
    return () => { resetCallbacks.delete(callback); };
}

let cleanupTreeListener: (() => void) | null = null;

$wizardDraftData.subscribe((tree) => {
    cleanupTreeListener?.();
    cleanupTreeListener = null;

    if (tree) {
        const handler = () => {
            bumpDraftDataVersion();
        };
        tree.onChanged(handler);
        cleanupTreeListener = () => tree.unChanged(handler);
    }
});

// Extract app keys currently selected in site config from draft data.
const $siteConfigAppKeys = computed(
    [$wizardDraftData, $wizardDataVersion],
    (data): Set<string> => {
        const keys = new Set<string>();
        if (!data) return keys;

        const configs = data.getPropertySets(SITE_CONFIG_PROP);
        for (const config of configs) {
            const key = config.getString(APPLICATION_KEY_PROP);
            if (key) {
                keys.add(key);
            }
        }
        return keys;
    },
);

// When an app is removed from site config, drop its mixin descriptors and data.
let previousAppKeys = new Set<string>();

$siteConfigAppKeys.subscribe((currentKeys) => {
    for (const key of previousAppKeys) {
        if (!currentKeys.has(key)) {
            // ? Descriptors may not contain entries for the removed app
            // (e.g. if the app was added after the wizard loaded and
            // descriptors were never re-fetched), so filter draft mixins
            // by the app key in the mixin name independently of descriptors.
            const descriptors = $mixinsDescriptors.get();
            const filteredDescriptors = descriptors.filter(d => d.getMixinName().getApplicationKey().toString() !== key);
            if (filteredDescriptors.length !== descriptors.length) {
                $mixinsDescriptors.set(filteredDescriptors);
            }

            const currentMixins = $wizardDraftMixins.get();
            const filteredMixins = currentMixins.filter(m => m.getName().getApplicationKey().toString() !== key);
            if (filteredMixins.length !== currentMixins.length) {
                $wizardDraftMixins.set(filteredMixins);
            }
        }
    }
    previousAppKeys = currentKeys;
});

let cleanupMixinTreeListeners: (() => void)[] = [];

$wizardDraftMixins.subscribe((mixins) => {
    cleanupMixinTreeListeners.forEach((cleanup) => cleanup());
    cleanupMixinTreeListeners = [];

    for (const mixin of mixins) {
        const tree = mixin.getData();
        if (tree) {
            const mixinName = mixin.getName().toString();
            let snapshotScheduled = false;
            const handler = () => {
                bumpMixinsVersion();
                if (!snapshotScheduled && $mixinsNeedingSnapshot.get().has(mixinName)) {
                    snapshotScheduled = true;
                    queueMicrotask(() => {
                        snapshotScheduled = false;
                        snapshotMixinBaseline(mixinName);
                    });
                }
            };
            tree.onChanged(handler);
            cleanupMixinTreeListeners.push(() => tree.unChanged(handler));
        }
    }
});

//
// * Rendered baseline snapshots
//
// Form rendering enriches draft trees with empty PropertyArrays and seeded null values
// (via InputField). These structural additions are not user changes. After rendering
// settles, copy the enriched draft back to persisted so the comparison baseline matches.

function snapshotContentBaseline(): void {
    if (!$needsRenderedSnapshot.get()) {
        return;
    }

    const draftData = $wizardDraftData.get();
    if (!draftData) {
        $needsRenderedSnapshot.set(false);
        return;
    }

    $wizardPersistedData.set(draftData.copy());
    $wizardDataChangedPaths.set({});
    $needsRenderedSnapshot.set(false);
}

function snapshotMixinBaseline(mixinName: string): void {
    const needed = $mixinsNeedingSnapshot.get();
    if (!needed.has(mixinName)) {
        return;
    }

    const draftMixin = $wizardDraftMixins.get().find((m) => m.getName().toString() === mixinName);
    if (!draftMixin) {
        const next = new Set(needed);
        next.delete(mixinName);
        $mixinsNeedingSnapshot.set(next);
        return;
    }

    $wizardPersistedMixins.set($wizardPersistedMixins.get().map((m) => {
        if (m.getName().toString() === mixinName) {
            return new Mixin(m.getName(), draftMixin.getData().copy());
        }
        return m;
    }));

    const next = new Set(needed);
    next.delete(mixinName);
    $mixinsNeedingSnapshot.set(next);
}

// Schedule content baseline after rendering enriches the draft tree.
let contentSnapshotScheduled = false;

$wizardDataVersion.subscribe(() => {
    if (!contentSnapshotScheduled && $needsRenderedSnapshot.get()) {
        contentSnapshotScheduled = true;
        queueMicrotask(() => {
            contentSnapshotScheduled = false;
            snapshotContentBaseline();
        });
    }
});

//
// * Tab title sync
//

// Lazily-captured " / AppName" suffix, extracted from the initial document title
// set by preLoadApplication() before the first display-name change fires.
let wizardTitleSuffix: string | undefined;

function getWizardTitleSuffix(): string {
    if (wizardTitleSuffix === undefined) {
        const idx = document.title.indexOf(' / ');
        wizardTitleSuffix = idx >= 0 ? document.title.slice(idx) : '';
    }

    return wizardTitleSuffix;
}

function applyDisplayNameToTitle(displayName: string, previousDisplayName: string | undefined): void {
    if (previousDisplayName === undefined) {
        return;
    }

    const contentType = $contentType.get();
    const name = displayName || NamePrettyfier.prettifyUnnamed(contentType?.getTitle() ?? '');
    document.title = name + getWizardTitleSuffix();
}

// Typing: fires on every keystroke via setDraftDisplayName.
$wizardDraftDisplayName.subscribe(applyDisplayNameToTitle);

// Save: persisted changes even when draft already held the typed value,
// so this covers the case where the draft subscription is a no-op.
$wizardPersistedDisplayName.subscribe(applyDisplayNameToTitle);

export function resetWizardContent(): void {
    $wizardPersistedDisplayName.set('');
    $wizardDraftDisplayName.set('');

    $wizardPersistedName.set(null);
    $wizardDraftName.set(null);

    $wizardPersistedData.set(null);
    $wizardDraftData.set(null);
    $wizardDataChangedPaths.set({});
    $wizardDataVersion.set(0);
    $needsRenderedSnapshot.set(false);

    if (contentDisarmTimer != null) {
        clearTimeout(contentDisarmTimer);
        contentDisarmTimer = null;
    }

    for (const timer of mixinDisarmTimers.values()) {
        clearTimeout(timer);
    }
    mixinDisarmTimers.clear();

    $wizardPersistedMixins.set([]);
    $wizardDraftMixins.set([]);
    $wizardMixinsVersion.set(0);
    $mixinsPendingMount.set(new Set());
    $mixinsNeedingSnapshot.set(new Set());

    $wizardPersistedPage.set(null);
    $wizardDraftPage.set(null);

    $wizardPersistedWorkflowState.set(null);
    $wizardDraftWorkflowState.set(null);
    $wizardDataValidation.set({});

    $contentType.set(null);
    $mixinsDescriptors.set([]);
    $isContentFormExpanded.set(true);
    $wizardReadOnly.set(true);
    $displayNameInputFocusRequested.set(false);

    for (const callback of resetCallbacks) {
        callback();
    }
}
