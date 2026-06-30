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
import {setAiDataTree, setAiWizardBridge} from './ai';
import {$layoutDescriptorOptions, $partDescriptorOptions} from './component-inspection.store';
import {$pageConfigDescriptor} from './page-inspection.store';
import {addStringOccurrence, removeStringOccurrence, setStringValue} from './wizardPropertyTree.utils';
import {resolveDisplayNameExpression} from './displayNameExpression.utils';
import {createDebounce} from '../utils/timing/createDebounce';
import {$contextContent} from './context/contextContent.store';
import {ContentPath} from '../../../app/content/ContentPath';
import {ContentExistsByPathRequest} from '../../../app/resource/ContentExistsByPathRequest';
import {seedFormDefaults} from '../shared/form/seedFormDefaults';

//
// * Types
//

export type WizardChangeSection = 'data' | 'displayName' | 'name' | 'mixins' | 'page' | 'workflow';

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

type WizardContentPathExists = {
    fetching: boolean;
    exists: boolean;
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

const $mixinsPendingMount = atom<Set<string>>(new Set());
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

export const $wizardContentPathExists = map<WizardContentPathExists>({fetching: false, exists: false});

export const $isContentFormExpanded = atom<boolean>(true);

export const $wizardReadOnly = atom<boolean>(true);

export const $displayNameInputFocusRequested = atom<boolean>(false);

//
// * Derived
//

export const $displayName = $wizardDraftDisplayName;

export const $hasPage = computed($wizardDraftPage, (page) => page != null);

export const $contentTypeDisplayName = computed($contentType, (contentType) => contentType?.getTitle() ?? '');

export const $wizardDataChanged = computed([$wizardPersistedData, $wizardDraftData, $wizardDataVersion], (persistedData, draftData): boolean => {
    return !dataTreesEqual(persistedData, draftData);
});

const $wizardDisplayNameChanged = computed(
    [$wizardPersistedDisplayName, $wizardDraftDisplayName],
    (persistedDisplayName, draftDisplayName): boolean => persistedDisplayName !== draftDisplayName
);

const $wizardNameChanged = computed(
    [$wizardPersistedName, $wizardDraftName],
    (persistedName, draftName): boolean => !contentNamesEqual(persistedName, draftName)
);

const $wizardMixinsChanged = computed(
    [$wizardPersistedMixins, $wizardDraftMixins, $wizardMixinsVersion],
    (persistedMixins, draftMixins): boolean => !mixinsEqual(persistedMixins, draftMixins)
);

const $wizardPageChanged = computed([$wizardPersistedPage, $wizardDraftPage], (persistedPage, draftPage): boolean =>
    persistedPage ? !persistedPage.equals(draftPage) : !!draftPage
);

const $wizardWorkflowChanged = computed(
    [$wizardPersistedWorkflowState, $wizardDraftWorkflowState],
    (persistedWorkflowState, draftWorkflowState): boolean => persistedWorkflowState !== draftWorkflowState
);

export const $wizardSectionChanges = computed(
    [$wizardDataChanged, $wizardDisplayNameChanged, $wizardNameChanged, $wizardMixinsChanged, $wizardPageChanged, $wizardWorkflowChanged],
    (data, displayName, name, mixins, page, workflow): WizardSectionChanges => {
        return {data, displayName, name, mixins, page, workflow};
    }
);

export const $wizardChangedSections = computed($wizardSectionChanges, (sections): WizardChangeSection[] => {
    return (Object.keys(sections) as WizardChangeSection[]).filter((section) => sections[section]);
});

export const $wizardHasChanges = computed($wizardSectionChanges, (sections): boolean => {
    return sections.data || sections.displayName || sections.name || sections.mixins || sections.page || sections.workflow;
});

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
    pathExists: {fetching: boolean; exists: boolean};
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
    pathExists,
}: CreateContentStateParams): ContentState | null {
    if (draftWorkflowState == null) {
        return null;
    }

    if (pathExists.exists) {
        return 'invalid';
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
    [$wizardDraftDisplayName, $wizardDraftName, $wizardDraftWorkflowState, $wizardDataValidation, $wizardContentPathExists],
    (displayName, name, draftWorkflowState, validation, pathExists): ContentState | null => {
        return createContentState({
            displayName,
            name,
            draftWorkflowState,
            validation,
            pathExists,
        });
    }
);

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
    unknown?: boolean;
};

export const $enabledMixinsNames = computed([$wizardDraftMixins, $mixinsDescriptors], (mixins, schemas): Set<string> => {
    const enabledMixinNames = new Set(mixins.map((mixin) => mixin.getName().toString()));
    const enabledNames = new Set<string>();

    for (const schema of schemas) {
        const name = schema.getName();
        if (!schema.isOptional() || enabledMixinNames.has(name)) {
            enabledNames.add(name);
        }
    }

    return enabledNames;
});

export const $unknownMixinsNames = computed([$wizardDraftMixins, $mixinsDescriptors], (mixins, schemas): Set<string> => {
    const knownNames = new Set(schemas.map((schema) => schema.getName()));
    const unknownNames = new Set<string>();

    for (const mixin of mixins) {
        const name = mixin.getName().toString();
        if (!knownNames.has(name)) {
            unknownNames.add(name);
        }
    }

    return unknownNames;
});

export const $mixinsTabs = computed(
    [$enabledMixinsNames, $mixinsDescriptors, $unknownMixinsNames],
    (enabledNames, schemas, unknownNames): MixinTabInfo[] => {
        const knownTabs = schemas
            .filter((schema) => enabledNames.has(schema.getName()))
            .map(
                (schema): MixinTabInfo => ({
                    name: schema.getName(),
                    title: schema.getTitle() ?? schema.getName(),
                })
            );

        const unknownTabs = Array.from(unknownNames).map(
            (name): MixinTabInfo => ({
                name,
                title: name,
                unknown: true,
            })
        );

        return [...knownTabs, ...unknownTabs];
    }
);

export type MixinMenuItem = {
    name: string;
    displayName: string;
    isOptional: boolean;
    isEnabled: boolean;
    unknown?: boolean;
};

export const $mixinsMenuItems = computed(
    [$mixinsDescriptors, $enabledMixinsNames, $unknownMixinsNames],
    (schemas, enabledNames, unknownNames): MixinMenuItem[] => {
        const knownItems = schemas.map(
            (schema): MixinMenuItem => ({
                name: schema.getName(),
                displayName: schema.getTitle() ?? schema.getName(),
                isOptional: schema.isOptional(),
                isEnabled: enabledNames.has(schema.getName()),
            })
        );

        const unknownItems = Array.from(unknownNames).map(
            (name): MixinMenuItem => ({
                name,
                displayName: name,
                isOptional: true,
                isEnabled: true,
                unknown: true,
            })
        );

        return [...knownItems, ...unknownItems];
    }
);

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

function seedMixinTree(mixin: Mixin, descriptor: MixinDescriptor): void {
    seedFormDefaults(descriptor.toForm(), mixin.getData().getRoot());
}

function createSeededMixinTree(descriptor: MixinDescriptor): PropertyTree {
    const tree = new PropertyTree();
    seedFormDefaults(descriptor.toForm(), tree.getRoot());
    return tree;
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

function isContentUntouched(content: Content): boolean {
    const created = content.getCreatedTime()?.getTime();
    const modified = content.getModifiedTime()?.getTime();

    return created != null && modified != null && created === modified;
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

let isPersistedContentUntouched = false;

function armRenderedSnapshot(content: Content): void {
    if (contentDisarmTimer != null) {
        clearTimeout(contentDisarmTimer);
        contentDisarmTimer = null;
    }

    $needsRenderedSnapshot.set(true);

    const cleanMixinNames = content
        .getMixins()
        .map((m) => m.getName().toString())
        .filter((name) => !isMixinDirtyByName(name));

    $mixinsPendingMount.set(new Set(cleanMixinNames));
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
    isPersistedContentUntouched = isContentUntouched(content);
    applyPersistedSectionsSnapshot(buildPersistedSectionsSnapshot(content));
    $wizardDataValidation.set({});

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
    return () => {
        persistedContentSetCallbacks.delete(callback);
    };
}

const serverMixinsChangedCallbacks = new Set<() => void>();

export function onWizardServerMixinsChanged(callback: () => void): () => void {
    serverMixinsChangedCallbacks.add(callback);
    return () => {
        serverMixinsChangedCallbacks.delete(callback);
    };
}

function notifyServerMixinsChanged(): void {
    for (const callback of serverMixinsChangedCallbacks) {
        callback();
    }
}

function getMixinNames(mixins: Mixin[]): string[] {
    return mixins.map((m) => m.getName().toString());
}

function hasMixinNamesChanged(previous: Set<string>, next: string[]): boolean {
    const nextSet = new Set(next);
    return previous.size !== nextSet.size || [...nextSet].some((name) => !previous.has(name));
}

//
// * Server-side update merge
//

export type ApplyServerContentResult = {
    syncedMixinNames: Set<string>;
};

export function applyServerSidePersistedContent(content: Content): ApplyServerContentResult {
    isPersistedContentUntouched = isContentUntouched(content);
    const snapshot = buildPersistedSectionsSnapshot(content);

    const previousMixinNames = new Set(getMixinNames($wizardPersistedMixins.get()));

    applyDisplayNameFromServer(snapshot.displayName);
    applyNameFromServer(snapshot.name);
    applyDataFromServer(snapshot.data);
    const syncedMixinNames = applyMixinsFromServer(snapshot.mixins);
    applyWorkflowFromServer(snapshot.workflow);

    if (hasMixinNamesChanged(previousMixinNames, getMixinNames(snapshot.mixins))) {
        notifyServerMixinsChanged();
    }

    return {syncedMixinNames};
}

function applyDisplayNameFromServer(nextValue: string): void {
    const isDirty = $wizardPersistedDisplayName.get() !== $wizardDraftDisplayName.get();
    $wizardPersistedDisplayName.set(nextValue);
    if (!isDirty) {
        $wizardDraftDisplayName.set(nextValue);
    }
}

function applyNameFromServer(nextValue: ContentName | null): void {
    const isDirty = !contentNamesEqual($wizardPersistedName.get(), $wizardDraftName.get());
    $wizardPersistedName.set(nextValue);
    if (!isDirty) {
        $wizardDraftName.set(nextValue);
    }
}

function applyDataFromServer(nextPersisted: PropertyTree | null): void {
    const oldPersisted = $wizardPersistedData.get();
    const currentDraft = $wizardDraftData.get();
    const isDirty = !dataTreesEqual(oldPersisted, currentDraft);

    $wizardPersistedData.set(nextPersisted);

    if (!isDirty) {
        $wizardDraftData.set(nextPersisted ? nextPersisted.copy() : null);
        $wizardDataChangedPaths.set({});
    }

    bumpDraftDataVersion();
}

function isMixinDataDirty(draftMixin: Mixin | undefined, persistedMixin: Mixin | undefined): boolean {
    if (draftMixin == null && persistedMixin == null) return false;
    if (draftMixin == null || persistedMixin == null) return true;
    return !ContentDiffHelper.dataEquals(draftMixin.getData(), persistedMixin.getData(), false);
}

function isMixinDirtyByName(name: string): boolean {
    const draftMixin = $wizardDraftMixins.get().find((m) => m.getName().toString() === name);
    const persistedMixin = $wizardPersistedMixins.get().find((m) => m.getName().toString() === name);
    return isMixinDataDirty(draftMixin, persistedMixin);
}

function applyMixinsFromServer(nextPersisted: Mixin[]): Set<string> {
    const oldPersisted = $wizardPersistedMixins.get();
    const currentDraft = $wizardDraftMixins.get();

    const oldPersistedByName = new Map<string, Mixin>();
    for (const mixin of oldPersisted) {
        oldPersistedByName.set(mixin.getName().toString(), mixin);
    }

    const draftByName = new Map<string, Mixin>();
    for (const mixin of currentDraft) {
        draftByName.set(mixin.getName().toString(), mixin);
    }

    $wizardPersistedMixins.set(nextPersisted);

    const nextDraft: Mixin[] = [];
    const handledNames = new Set<string>();
    const syncedMixinNames = new Set<string>();

    for (const persistedMixin of nextPersisted) {
        const name = persistedMixin.getName().toString();
        handledNames.add(name);

        const draftMixin = draftByName.get(name);

        // User explicitly disabled an optional mixin that previously existed —
        // honour that and skip re-adding from server.
        if (draftMixin == null && oldPersistedByName.has(name)) {
            continue;
        }

        if (isMixinDataDirty(draftMixin, oldPersistedByName.get(name))) {
            nextDraft.push((draftMixin ?? persistedMixin).clone());
        } else {
            nextDraft.push(persistedMixin.clone());
            syncedMixinNames.add(name);
        }
    }

    // Locally added/enabled mixins missing on server: keep only if dirty.
    for (const draftMixin of currentDraft) {
        const name = draftMixin.getName().toString();
        if (handledNames.has(name)) continue;

        if (isMixinDataDirty(draftMixin, oldPersistedByName.get(name))) {
            nextDraft.push(draftMixin.clone());
        }
    }

    $wizardDraftMixins.set(nextDraft);
    bumpMixinsVersion();

    return syncedMixinNames;
}

export function applyWorkflowFromServer(nextWorkflow: WorkflowState | null): void {
    const isDirty = $wizardPersistedWorkflowState.get() !== $wizardDraftWorkflowState.get();
    $wizardPersistedWorkflowState.set(nextWorkflow);
    if (!isDirty) {
        $wizardDraftWorkflowState.set(nextWorkflow);
    }
}

export function initializeWizardContentState(
    content: Content,
    contentType: ContentType | null,
    mixins: MixinDescriptor[],
    workflowState?: WorkflowState | null
): void {
    setPersistedContent(content);
    $contentType.set(contentType);
    setMixinsDescriptors([...mixins]);

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

function regenerateDisplayNameFromExpression(): void {
    const contentType = $contentType.get();
    if (!contentType?.hasDisplayNameExpression()) {
        return;
    }

    const data = $wizardDraftData.get();
    if (data == null) {
        return;
    }

    setDraftDisplayName(resolveDisplayNameExpression(contentType.getDisplayNameExpression(), contentType.getForm(), data));
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
    seedMixinDefaults();
}

const mixinSeedRequestCallbacks = new Set<(applicationKeys: string[]) => void>();

export function requestMixinSeed(applicationKeys: string[]): void {
    if (applicationKeys.length === 0) {
        return;
    }

    for (const callback of mixinSeedRequestCallbacks) {
        callback([...applicationKeys]);
    }
}

export function onMixinSeedRequested(callback: (applicationKeys: string[]) => void): () => void {
    mixinSeedRequestCallbacks.add(callback);
    return () => {
        mixinSeedRequestCallbacks.delete(callback);
    };
}

function seedMixinDefaults(): void {
    const descriptors = $mixinsDescriptors.get();
    const draft = $wizardDraftMixins.get();

    const draftByName = new Map(draft.map((m) => [m.getName().toString(), m]));

    const draftAdditions: Mixin[] = [];
    const seededNames: string[] = [];

    for (const descriptor of descriptors) {
        const name = descriptor.getName();

        // Seed into the draft only. On already-saved content the persisted
        // baseline keeps reflecting the server, so seeded defaults stay dirty;
        // untouched content rebaselines them below.
        const draftMixin = draftByName.get(name);
        if (draftMixin) {
            seedMixinTree(draftMixin, descriptor);
            seededNames.push(name);
        } else if (!descriptor.isOptional()) {
            draftAdditions.push(new Mixin(new MixinName(name), createSeededMixinTree(descriptor)));
        }
    }

    if (draftAdditions.length > 0) {
        $wizardDraftMixins.set([...draft, ...draftAdditions]);
    }

    if (isPersistedContentUntouched) {
        baselineMixinsFromDraft();
        return;
    }

    disarmSeededMixinSnapshots(seededNames);
}

function baselineMixinsFromDraft(): void {
    const draftMixins = $wizardDraftMixins.get();

    $wizardPersistedMixins.set(cloneMixins(draftMixins));
    bumpMixinsVersion();

    const pending = new Set($mixinsPendingMount.get());
    for (const mixin of draftMixins) {
        pending.add(mixin.getName().toString());
    }
    $mixinsPendingMount.set(pending);
}

// Descriptors load asynchronously, so seeding often runs after the rendered
// snapshot was armed against a still-empty mixin. A seeded default that makes
// the draft diverge from the server is a genuine unsaved change; release it
// from the pending-mount baseline so the tab mount does not swallow it.
function disarmSeededMixinSnapshots(names: string[]): void {
    const pending = $mixinsPendingMount.get();
    const needing = $mixinsNeedingSnapshot.get();
    let nextPending = pending;
    let nextNeeding = needing;

    for (const name of names) {
        if (!isMixinDirtyByName(name)) {
            continue;
        }
        if (nextPending.has(name)) {
            if (nextPending === pending) {
                nextPending = new Set(pending);
            }
            nextPending.delete(name);
        }
        if (nextNeeding.has(name)) {
            if (nextNeeding === needing) {
                nextNeeding = new Set(needing);
            }
            nextNeeding.delete(name);
        }
    }

    if (nextPending !== pending) {
        $mixinsPendingMount.set(nextPending);
    }
    if (nextNeeding !== needing) {
        $mixinsNeedingSnapshot.set(nextNeeding);
    }
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

    if ($displayName.get().trim().length > 0) {
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

    queueMicrotask(() => {
        snapshotContentBaseline();
    });

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

    const nextPending = new Set(pending);
    nextPending.delete(name);
    $mixinsPendingMount.set(nextPending);

    const needed = new Set($mixinsNeedingSnapshot.get());
    needed.add(name);
    $mixinsNeedingSnapshot.set(needed);

    queueMicrotask(() => {
        snapshotMixinBaseline(name);
    });

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
              const newMixinTree = mixinDescriptor ? createSeededMixinTree(mixinDescriptor) : new PropertyTree();
              const mixinToAdd = persistedMixin ? persistedMixin.clone() : new Mixin(new MixinName(name), newMixinTree);
              return [...currentMixins, mixinToAdd];
          })()
        : currentMixins.filter((mixin) => mixin.getName().toString() !== name);

    setDraftMixins(nextMixins);
}

const resetCallbacks = new Set<() => void>();

export function onWizardContentReset(callback: () => void): () => void {
    resetCallbacks.add(callback);
    return () => {
        resetCallbacks.delete(callback);
    };
}

let cleanupTreeListener: (() => void) | null = null;

$wizardDraftData.subscribe((tree) => {
    cleanupTreeListener?.();
    cleanupTreeListener = null;

    // The AI bridge writes translated values directly into this tree, so AI must
    // see the same instance the form is bound to.
    setAiDataTree(tree as PropertyTree | null);

    if (tree) {
        const handler = () => {
            bumpDraftDataVersion();
            regenerateDisplayNameFromExpression();
        };
        tree.onChanged(handler);
        cleanupTreeListener = () => tree.unChanged(handler);
    }
});

// Expose wizard writers to the AI bridge. Registering at module load (rather than
// importing the wizard store from ai.bridge) keeps the dependency one-directional:
// wizardContent → ai, with no back-edge that would form a module cycle.
setAiWizardBridge({
    applyDisplayName: setDraftDisplayName,
    getCurrentDisplayName: () => $wizardDraftDisplayName.get(),
    findMixinByKey: (key) => $wizardDraftMixins.get().find((m) => m.getName().toString() === key),
    getCurrentMixins: () => $wizardDraftMixins.get(),
    getCurrentMixinDescriptors: () => $mixinsDescriptors.get(),
    getCurrentPage: () => $wizardDraftPage.get(),
    getCurrentPageDescriptor: () => $pageConfigDescriptor.get(),
    getCurrentComponentDescriptors: () => [...$partDescriptorOptions.get(), ...$layoutDescriptorOptions.get()],
});

const $siteConfigAppKeys = computed([$wizardDraftData, $wizardDataVersion], (data): Set<string> => {
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
});

let previousAppKeys = new Set<string>();

$siteConfigAppKeys.subscribe((currentKeys) => {
    for (const key of previousAppKeys) {
        if (!currentKeys.has(key)) {
            const descriptors = $mixinsDescriptors.get();
            const filteredDescriptors = descriptors.filter((d) => d.getMixinName().getApplicationKey().toString() !== key);
            if (filteredDescriptors.length !== descriptors.length) {
                $mixinsDescriptors.set(filteredDescriptors);
            }

            const currentMixins = $wizardDraftMixins.get();
            const filteredMixins = currentMixins.filter((m) => m.getName().getApplicationKey().toString() !== key);
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

    $wizardPersistedMixins.set(
        $wizardPersistedMixins.get().map((m) => {
            if (m.getName().toString() === mixinName) {
                return new Mixin(m.getName(), draftMixin.getData().copy());
            }
            return m;
        })
    );

    const next = new Set(needed);
    next.delete(mixinName);
    $mixinsNeedingSnapshot.set(next);
}

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
// * Wizard content path existence check
//

const PATH_CHECK_DEBOUNCE_MS = 500;

// Sequence guard: only the latest path check may write the result. A slower
// response for a stale name (or one resolving after the wizard was reset) must
// be ignored, otherwise it could overwrite the state with an outdated value.
let pathCheckSeq = 0;

const debouncedPathCheck = createDebounce(async () => {
    const seq = ++pathCheckSeq;
    const draftName = $wizardDraftName.get();

    if (!draftName || draftName.isUnnamed()) {
        $wizardContentPathExists.set({fetching: false, exists: false});
        return;
    }

    const persistedName = $wizardPersistedName.get();

    if (persistedName && !persistedName.isUnnamed() && draftName.equals(persistedName)) {
        $wizardContentPathExists.set({fetching: false, exists: false});
        return;
    }

    const parentPath = $contextContent.get()?.getPath().getParentPath() || ContentPath.getRoot();
    const fullPath = ContentPath.create().fromParent(parentPath, draftName.toString()).build();

    $wizardContentPathExists.setKey('fetching', true);

    try {
        const exists = await new ContentExistsByPathRequest(fullPath.toString()).sendAndParse();
        if (seq !== pathCheckSeq) return;
        $wizardContentPathExists.set({fetching: false, exists});
    } catch {
        if (seq !== pathCheckSeq) return;
        $wizardContentPathExists.set({fetching: false, exists: false});
    }
}, PATH_CHECK_DEBOUNCE_MS);

$wizardDraftName.listen(() => {
    debouncedPathCheck();
});

//
// * Tab title sync
//

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

$wizardDraftDisplayName.subscribe(applyDisplayNameToTitle);
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
    isPersistedContentUntouched = false;

    $wizardPersistedPage.set(null);
    $wizardDraftPage.set(null);

    $wizardPersistedWorkflowState.set(null);
    $wizardDraftWorkflowState.set(null);
    $wizardDataValidation.set({});

    // Invalidate any scheduled or in-flight path check so a stale response
    // cannot mark the freshly opened content as invalid.
    debouncedPathCheck.cancel();
    pathCheckSeq++;
    $wizardContentPathExists.set({fetching: false, exists: false});

    $contentType.set(null);
    $mixinsDescriptors.set([]);
    $isContentFormExpanded.set(true);
    $wizardReadOnly.set(true);
    $displayNameInputFocusRequested.set(false);

    for (const callback of resetCallbacks) {
        callback();
    }
}
