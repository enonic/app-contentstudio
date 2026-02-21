import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import type {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {atom, computed, map} from 'nanostores';
import type {Content} from '../../../app/content/Content';
import type {ContentName} from '../../../app/content/ContentName';
import {Mixin} from '../../../app/content/Mixin';
import type {MixinDescriptor} from '../../../app/content/MixinDescriptor';
import {MixinName} from '../../../app/content/MixinName';
import type {WorkflowState} from '../../../app/content/WorkflowState';
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

const $wizardDataVersion = atom<number>(0);

export const $wizardPersistedMixins = wizardTrackedState.mixins.persisted;

export const $wizardDraftMixins = wizardTrackedState.mixins.draft;

export const $wizardPersistedPage = wizardTrackedState.page.persisted;

export const $wizardDraftPage = wizardTrackedState.page.draft;

export const $wizardPersistedWorkflowState = wizardTrackedState.workflow.persisted;

export const $wizardDraftWorkflowState = wizardTrackedState.workflow.draft;

export const $contentType = atom<ContentType | null>(null);

export const $mixinsDescriptors = atom<MixinDescriptor[]>([]);

export const $wizardDataValidation = map<FormDataValidation>({});

//
// * Derived
//

export const $displayName = $wizardDraftDisplayName;

export const $hasPage = computed($wizardDraftPage, (page) => page != null);

export const $contentTypeDisplayName = computed($contentType, (contentType) => contentType?.getDisplayName() ?? '');

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
    [$wizardPersistedMixins, $wizardDraftMixins],
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

export type MixinTabInfo = {
    name: string;
    displayName: string;
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
            displayName: schema.getDisplayName() ?? schema.getName(),
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
        displayName: schema.getDisplayName() ?? schema.getName(),
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

    const baseUrl = getPortalSiteConfigBaseUrl(data);
    data.removeProperty(LEGACY_BASE_URL_INPUT_PROP, 0);

    if (baseUrl != null && baseUrl.trim().length > 0) {
        data.setString(BASE_URL_INPUT_PROP, 0, baseUrl);
    } else {
        data.removeProperty(BASE_URL_INPUT_PROP, 0);
    }

    return data;
}

function bumpDraftDataVersion(): void {
    $wizardDataVersion.set($wizardDataVersion.get() + 1);
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

        if (!ContentDiffHelper.dataEquals(leftMixin.getData(), rightMixin.getData(), true)) {
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

    $wizardPersistedPage.set(snapshot.page);
    $wizardDraftPage.set(clonePage(snapshot.page));

    $wizardPersistedWorkflowState.set(snapshot.workflow);
    $wizardDraftWorkflowState.set(snapshot.workflow);
}

//
// * Actions
//

export function setPersistedContent(content: Content): void {
    applyPersistedSectionsSnapshot(buildPersistedSectionsSnapshot(content));
}

export function initializeWizardContentState(
    content: Content,
    contentType: ContentType | null,
    mixins: MixinDescriptor[],
    workflowState: WorkflowState | null,
): void {
    setPersistedContent(content);
    $contentType.set(contentType);
    $mixinsDescriptors.set([...mixins]);

    if (workflowState != null) {
        $wizardPersistedWorkflowState.set(workflowState);
        $wizardDraftWorkflowState.set(workflowState);
    }
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
    $wizardDraftWorkflowState.set(state);
}

export function setContentType(contentType: ContentType): void {
    $contentType.set(contentType);
}

export function setMixinsDescriptors(mixinsDescriptors: MixinDescriptor[]): void {
    $mixinsDescriptors.set(mixinsDescriptors);
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

export function resetWizardContent(): void {
    $wizardPersistedDisplayName.set('');
    $wizardDraftDisplayName.set('');

    $wizardPersistedName.set(null);
    $wizardDraftName.set(null);

    $wizardPersistedData.set(null);
    $wizardDraftData.set(null);
    $wizardDataChangedPaths.set({});
    $wizardDataVersion.set(0);

    $wizardPersistedMixins.set([]);
    $wizardDraftMixins.set([]);

    $wizardPersistedPage.set(null);
    $wizardDraftPage.set(null);

    $wizardPersistedWorkflowState.set(null);
    $wizardDraftWorkflowState.set(null);

    $contentType.set(null);
    $mixinsDescriptors.set([]);

    for (const callback of resetCallbacks) {
        callback();
    }
}
