import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ContentBuilder, type Content} from '../../../app/content/Content';
import {ContentName} from '../../../app/content/ContentName';
import {Mixin} from '../../../app/content/Mixin';
import type {MixinDescriptor} from '../../../app/content/MixinDescriptor';
import {MixinName} from '../../../app/content/MixinName';
import {Workflow} from '../../../app/content/Workflow';
import {WorkflowState} from '../../../app/content/WorkflowState';
import {PageBuilder, type Page} from '../../../app/page/Page';
import {
    $isContentFormExpanded,
    addDraftStringOccurrenceByPath,
    $mixinsDescriptors,
    $wizardDataChangedPaths,
    $wizardChangedSections,
    $wizardDraftData,
    $wizardDraftMixins,
    $wizardHasChanges,
    $wizardSectionChanges,
    initializeWizardContentState,
    getDraftStringByPath,
    removeDraftStringOccurrenceByPath,
    resetWizardContent,
    setDraftDisplayName,
    setDraftMixinEnabled,
    setDraftName,
    setDraftPage,
    setDraftStringByPath,
    setDraftWorkflowState,
    setContentFormExpanded,
    toggleContentFormExpanded,
    setPersistedContent,
} from './wizardContent.store';
import {getMixinDataContext} from './wizardMixinData.store';

function createMixinDescriptor(name: string, optional: boolean): MixinDescriptor {
    return {
        getName: () => name,
        getDisplayName: () => name,
        isOptional: () => optional,
    } as unknown as MixinDescriptor;
}

function createContent({
    displayName = 'Content',
    data = new PropertyTree(),
    mixins = [],
    page = null,
    workflowState = WorkflowState.IN_PROGRESS,
    contentType = ContentTypeName.UNSTRUCTURED,
}: {
    displayName?: string;
    data?: PropertyTree;
    mixins?: Mixin[];
    page?: Page | null;
    workflowState?: WorkflowState;
    contentType?: ContentTypeName;
} = {}): Content {
    const workflow = Workflow.create().setState(workflowState).build();
    const builder = new ContentBuilder();
    builder.setData(data);
    builder.setName(new ContentName('content'));
    builder.setType(contentType);
    builder.setDisplayName(displayName);
    builder.setPage(page);
    builder.setMixins(mixins);
    builder.setWorkflow(workflow);

    return builder.build();
}

describe('wizardContent.store', () => {
    beforeEach(() => {
        resetWizardContent();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('keeps all section flags false on initialization', () => {
        const content = createContent();

        initializeWizardContentState(content, null, [], WorkflowState.IN_PROGRESS);

        expect($wizardSectionChanges.get()).toEqual({
            data: false,
            displayName: false,
            name: false,
            mixins: false,
            page: false,
            workflow: false,
        });
        expect($wizardChangedSections.get()).toEqual([]);
        expect($wizardHasChanges.get()).toBe(false);
    });

    it('marks displayName as changed when display name is updated', () => {
        initializeWizardContentState(createContent({displayName: 'Original'}), null, [], WorkflowState.IN_PROGRESS);

        setDraftDisplayName('Updated');

        expect($wizardSectionChanges.get().displayName).toBe(true);
        expect($wizardSectionChanges.get().data).toBe(false);
        expect($wizardChangedSections.get()).toContain('displayName');
        expect($wizardHasChanges.get()).toBe(true);
    });

    it('marks name as changed when name is updated', () => {
        initializeWizardContentState(createContent(), null, [], WorkflowState.IN_PROGRESS);

        setDraftName(new ContentName('renamed-content'));

        expect($wizardSectionChanges.get().name).toBe(true);
        expect($wizardChangedSections.get()).toContain('name');
    });

    it('marks data as changed when string value is set by path', () => {
        const persistedData = new PropertyTree();
        persistedData.addString('title', 'Original');
        initializeWizardContentState(createContent({data: persistedData}), null, [], WorkflowState.IN_PROGRESS);

        setDraftStringByPath(PropertyPath.fromString('title'), 'Updated');

        expect($wizardSectionChanges.get().data).toBe(true);
        expect($wizardChangedSections.get()).toContain('data');
    });

    it('bumps changed-path version for repeated dirty edits on same path', () => {
        const persistedData = new PropertyTree();
        persistedData.addString('title', 'Original');
        initializeWizardContentState(createContent({data: persistedData}), null, [], WorkflowState.IN_PROGRESS);

        setDraftStringByPath(PropertyPath.fromString('title'), 'First');
        expect($wizardDataChangedPaths.get().title).toBe(1);

        setDraftStringByPath(PropertyPath.fromString('title'), 'Second');
        expect($wizardDataChangedPaths.get().title).toBe(2);
    });

    it('reads draft string value from draft tree', () => {
        const persistedData = new PropertyTree();
        persistedData.addString('title', 'Original');
        initializeWizardContentState(createContent({data: persistedData}), null, [], WorkflowState.IN_PROGRESS);

        setDraftStringByPath(PropertyPath.fromString('title'), 'Updated');

        expect(getDraftStringByPath(PropertyPath.fromString('title'))).toBe('Updated');
    });

    it('hydrates baseUrl draft from portal site config for site content', () => {
        const persistedData = new PropertyTree();
        const portalSiteConfig = persistedData.addPropertySet('siteConfig');
        portalSiteConfig.setString('applicationKey', 0, ApplicationKey.PORTAL.toString());
        portalSiteConfig.addPropertySet('config').setString('baseUrl', 0, 'https://example.com');
        initializeWizardContentState(createContent({data: persistedData, contentType: ContentTypeName.SITE}), null, [], WorkflowState.IN_PROGRESS);

        expect(getDraftStringByPath(PropertyPath.fromString('baseUrl'))).toBe('https://example.com');
        expect($wizardSectionChanges.get().data).toBe(false);
    });

    it('clears data change when string is reverted to original value', () => {
        const persistedData = new PropertyTree();
        persistedData.addString('title', 'Original');
        initializeWizardContentState(createContent({data: persistedData}), null, [], WorkflowState.IN_PROGRESS);

        setDraftStringByPath(PropertyPath.fromString('title'), 'Updated');
        expect($wizardSectionChanges.get().data).toBe(true);

        setDraftStringByPath(PropertyPath.fromString('title'), 'Original');

        expect($wizardSectionChanges.get().data).toBe(false);
    });

    it('clears data change after editing and clearing absent persisted field', () => {
        initializeWizardContentState(createContent({data: new PropertyTree()}), null, [], WorkflowState.IN_PROGRESS);
        const path = PropertyPath.fromString('title');

        setDraftStringByPath(path, 'Temporary');
        expect($wizardSectionChanges.get().data).toBe(true);

        setDraftStringByPath(path, '');
        expect($wizardSectionChanges.get().data).toBe(false);
        expect($wizardDraftData.get()?.getProperty(path.toString())).toBeNull();
    });

    it('clears data change after editing and clearing explicitly-empty persisted field', () => {
        const persistedData = new PropertyTree();
        const path = PropertyPath.fromString('title');
        persistedData.setStringByPath(path, '');
        initializeWizardContentState(createContent({data: persistedData}), null, [], WorkflowState.IN_PROGRESS);

        setDraftStringByPath(path, 'Temporary');
        expect($wizardSectionChanges.get().data).toBe(true);

        setDraftStringByPath(path, '');
        expect($wizardSectionChanges.get().data).toBe(false);
        expect($wizardDraftData.get()?.getProperty(path.toString())).not.toBeNull();
    });

    it('marks mixins as changed when optional mixin is enabled', () => {
        const descriptor = createMixinDescriptor('app:seo', true);
        initializeWizardContentState(createContent(), null, [descriptor], WorkflowState.IN_PROGRESS);

        setDraftMixinEnabled('app:seo', true);

        expect($wizardSectionChanges.get().mixins).toBe(true);
        expect($wizardChangedSections.get()).toContain('mixins');
    });

    it('clears mixin section change after editing and clearing initially-empty field', () => {
        const descriptor = createMixinDescriptor('app:seo', true);
        const mixin = new Mixin(new MixinName('app:seo'), new PropertyTree());
        initializeWizardContentState(createContent({mixins: [mixin]}), null, [descriptor], WorkflowState.IN_PROGRESS);

        const formData = getMixinDataContext('app:seo');
        const path = PropertyPath.fromString('title');

        formData.setDraftStringByPath(path, 'Temporary');
        expect($wizardSectionChanges.get().mixins).toBe(true);

        formData.setDraftStringByPath(path, '');
        expect($wizardSectionChanges.get().mixins).toBe(false);
        expect($wizardChangedSections.get()).not.toContain('mixins');
    });

    it('clears mixin section change after editing and clearing explicitly-empty persisted field', () => {
        const descriptor = createMixinDescriptor('app:seo', true);
        const mixinData = new PropertyTree();
        mixinData.setStringByPath(PropertyPath.fromString('title'), '');
        const mixin = new Mixin(new MixinName('app:seo'), mixinData);
        initializeWizardContentState(createContent({mixins: [mixin]}), null, [descriptor], WorkflowState.IN_PROGRESS);

        const formData = getMixinDataContext('app:seo');
        const path = PropertyPath.fromString('title');

        formData.setDraftStringByPath(path, 'Temporary');
        expect($wizardSectionChanges.get().mixins).toBe(true);

        formData.setDraftStringByPath(path, '');
        expect($wizardSectionChanges.get().mixins).toBe(false);
    });

    it('clears mixin section change after editing and clearing nested initially-empty field', () => {
        const descriptor = createMixinDescriptor('app:seo', true);
        const mixin = new Mixin(new MixinName('app:seo'), new PropertyTree());
        initializeWizardContentState(createContent({mixins: [mixin]}), null, [descriptor], WorkflowState.IN_PROGRESS);

        const formData = getMixinDataContext('app:seo');
        const path = PropertyPath.fromString('group.title');

        formData.setDraftStringByPath(path, 'Temporary');
        expect($wizardSectionChanges.get().mixins).toBe(true);

        formData.setDraftStringByPath(path, '');
        expect($wizardSectionChanges.get().mixins).toBe(false);
    });

    it('clears mixin change after remove/add roundtrip when resulting occurrences match persisted', () => {
        const descriptor = createMixinDescriptor('app:seo', true);
        const mixinData = new PropertyTree();
        mixinData.addString('keywords', 'a');
        mixinData.addString('keywords', 'b');
        mixinData.addString('keywords', 'c');
        const mixin = new Mixin(new MixinName('app:seo'), mixinData);
        initializeWizardContentState(createContent({mixins: [mixin]}), null, [descriptor], WorkflowState.IN_PROGRESS);

        const formData = getMixinDataContext('app:seo');
        const path = PropertyPath.fromString('keywords');

        formData.removeOccurrence(path, 1);
        formData.addOccurrence(path, 2);
        formData.setDraftStringByPath(PropertyPath.fromString('keywords[1]'), 'b');
        formData.setDraftStringByPath(PropertyPath.fromString('keywords[2]'), 'c');

        expect($wizardSectionChanges.get().mixins).toBe(false);
    });

    it('marks page as changed when page draft is updated', () => {
        initializeWizardContentState(createContent(), null, [], WorkflowState.IN_PROGRESS);

        setDraftPage(new PageBuilder().setConfig(new PropertyTree()).build());

        expect($wizardSectionChanges.get().page).toBe(true);
        expect($wizardChangedSections.get()).toContain('page');
    });

    it('marks workflow as changed when workflow draft state changes', () => {
        initializeWizardContentState(createContent(), null, [], WorkflowState.IN_PROGRESS);

        setDraftWorkflowState(WorkflowState.READY);

        expect($wizardSectionChanges.get().workflow).toBe(true);
        expect($wizardChangedSections.get()).toContain('workflow');
    });

    it('removes middle occurrence and shifts remaining values in draft tree', () => {
        const persistedData = new PropertyTree();
        persistedData.addString('title', 'a');
        persistedData.addString('title', 'b');
        persistedData.addString('title', 'c');
        initializeWizardContentState(createContent({data: persistedData}), null, [], WorkflowState.IN_PROGRESS);

        removeDraftStringOccurrenceByPath(PropertyPath.fromString('title'), 1);

        const draftData = $wizardDraftData.get();
        const titleArray = draftData?.getRoot().getPropertyArray('title');
        expect(titleArray?.getSize()).toBe(2);
        expect(titleArray?.get(0)?.getString()).toBe('a');
        expect(titleArray?.get(1)?.getString()).toBe('c');
        expect($wizardSectionChanges.get().data).toBe(true);
    });

    it('adds new null occurrence after removing middle occurrence', () => {
        const persistedData = new PropertyTree();
        persistedData.addString('title', 'a');
        persistedData.addString('title', 'b');
        persistedData.addString('title', 'c');
        initializeWizardContentState(createContent({data: persistedData}), null, [], WorkflowState.IN_PROGRESS);

        removeDraftStringOccurrenceByPath(PropertyPath.fromString('title'), 1);
        addDraftStringOccurrenceByPath(PropertyPath.fromString('title'), 2);

        const draftData = $wizardDraftData.get();
        const titleArray = draftData?.getRoot().getPropertyArray('title');
        expect(titleArray?.getSize()).toBe(3);
        expect(titleArray?.get(0)?.getString()).toBe('a');
        expect(titleArray?.get(1)?.getString()).toBe('c');
        expect(titleArray?.get(2)?.getString()).toBeNull();
        expect($wizardSectionChanges.get().data).toBe(true);
    });

    it('clears data change after remove/add roundtrip when resulting occurrences match persisted', () => {
        const persistedData = new PropertyTree();
        persistedData.addString('title', 'a');
        persistedData.addString('title', 'b');
        persistedData.addString('title', 'c');
        initializeWizardContentState(createContent({data: persistedData}), null, [], WorkflowState.IN_PROGRESS);

        removeDraftStringOccurrenceByPath(PropertyPath.fromString('title'), 1);
        addDraftStringOccurrenceByPath(PropertyPath.fromString('title'), 2);
        setDraftStringByPath(PropertyPath.fromString('title[1]'), 'b');
        setDraftStringByPath(PropertyPath.fromString('title[2]'), 'c');

        const draftData = $wizardDraftData.get();
        expect(draftData?.toJson()).toEqual(persistedData.toJson());
        expect($wizardSectionChanges.get().data).toBe(false);
    });

    it('clears data change after remove/add roundtrip when persisted occurrence is null', () => {
        const persistedData = new PropertyTree();
        persistedData.setString('title', 0, null as unknown as string);
        initializeWizardContentState(createContent({data: persistedData}), null, [], WorkflowState.IN_PROGRESS);

        removeDraftStringOccurrenceByPath(PropertyPath.fromString('title'), 0);
        expect($wizardSectionChanges.get().data).toBe(true);

        addDraftStringOccurrenceByPath(PropertyPath.fromString('title'), 0);

        expect($wizardDraftData.get()?.getProperty('title[0]')?.hasNullValue()).toBe(true);
        expect($wizardSectionChanges.get().data).toBe(false);
    });

    it('tracks changed paths when adding occurrence', () => {
        const persistedData = new PropertyTree();
        persistedData.addString('title', 'a');
        persistedData.addString('title', 'b');
        persistedData.addString('title', 'c');
        initializeWizardContentState(createContent({data: persistedData}), null, [], WorkflowState.IN_PROGRESS);

        addDraftStringOccurrenceByPath(PropertyPath.fromString('title'), 3);

        expect($wizardDataChangedPaths.get().title).toBeDefined();
        expect($wizardSectionChanges.get().data).toBe(true);

        const draftData = $wizardDraftData.get();
        const titleArray = draftData?.getRoot().getPropertyArray('title');
        expect(titleArray?.getSize()).toBe(4);
    });

    it('clears change when newly added occurrence is removed', () => {
        const persistedData = new PropertyTree();
        persistedData.addString('title', 'a');
        persistedData.addString('title', 'b');
        initializeWizardContentState(createContent({data: persistedData}), null, [], WorkflowState.IN_PROGRESS);

        addDraftStringOccurrenceByPath(PropertyPath.fromString('title'), 2);
        removeDraftStringOccurrenceByPath(PropertyPath.fromString('title'), 2);

        const draftData = $wizardDraftData.get();
        const titleArray = draftData?.getRoot().getPropertyArray('title');
        expect(titleArray?.getSize()).toBe(2);
        expect(titleArray?.get(0)?.getString()).toBe('a');
        expect(titleArray?.get(1)?.getString()).toBe('b');
        expect($wizardSectionChanges.get().data).toBe(false);
    });

    it('handles removing first occurrence and keeping added one', () => {
        const persistedData = new PropertyTree();
        persistedData.addString('title', 'a');
        persistedData.addString('title', 'b');
        initializeWizardContentState(createContent({data: persistedData}), null, [], WorkflowState.IN_PROGRESS);

        addDraftStringOccurrenceByPath(PropertyPath.fromString('title'), 2);
        removeDraftStringOccurrenceByPath(PropertyPath.fromString('title'), 0);

        const draftData = $wizardDraftData.get();
        const titleArray = draftData?.getRoot().getPropertyArray('title');
        expect(titleArray?.getSize()).toBe(2);
        expect(titleArray?.get(0)?.getString()).toBe('b');
        expect(titleArray?.get(1)?.getString()).toBeNull();
        expect($wizardSectionChanges.get().data).toBe(true);
    });

    it('clears stale indexed changed-path keys when removing occurrence reverts to persisted state', () => {
        const persistedData = new PropertyTree();
        persistedData.addString('title', 'a');
        persistedData.addString('title', 'b');
        initializeWizardContentState(createContent({data: persistedData}), null, [], WorkflowState.IN_PROGRESS);

        // Add occurrence, edit it, then remove it — should fully revert
        addDraftStringOccurrenceByPath(PropertyPath.fromString('title'), 2);
        setDraftStringByPath(PropertyPath.fromString('title[2]'), 'x');
        expect($wizardDataChangedPaths.get()['title[2]']).toBeDefined();

        removeDraftStringOccurrenceByPath(PropertyPath.fromString('title'), 2);

        expect($wizardDataChangedPaths.get()['title[2]']).toBeUndefined();
        expect($wizardDataChangedPaths.get().title).toBeUndefined();
        expect($wizardSectionChanges.get().data).toBe(false);
    });

    it('clears stale base changed-path key when indexed value is cleared to absent', () => {
        const persistedData = new PropertyTree();
        persistedData.addString('title', 'a');
        persistedData.addString('title', 'b');
        initializeWizardContentState(createContent({data: persistedData}), null, [], WorkflowState.IN_PROGRESS);

        addDraftStringOccurrenceByPath(PropertyPath.fromString('title'), 2);
        setDraftStringByPath(PropertyPath.fromString('title[2]'), 'x');

        setDraftStringByPath(PropertyPath.fromString('title[2]'), '');

        const draftData = $wizardDraftData.get();
        const titleArray = draftData?.getRoot().getPropertyArray('title');
        expect(titleArray?.getSize()).toBe(2);
        expect(titleArray?.get(0)?.getString()).toBe('a');
        expect(titleArray?.get(1)?.getString()).toBe('b');
        expect($wizardDataChangedPaths.get()['title[2]']).toBeUndefined();
        expect($wizardDataChangedPaths.get().title).toBeUndefined();
        expect($wizardSectionChanges.get().data).toBe(false);
    });

    it('resets section changes when persisted snapshot is replaced by current draft', () => {
        const descriptor = createMixinDescriptor('app:seo', true);
        initializeWizardContentState(createContent({displayName: 'Original'}), null, [descriptor], WorkflowState.IN_PROGRESS);

        setDraftDisplayName('Updated');
        setDraftMixinEnabled('app:seo', true);
        setDraftPage(new PageBuilder().setConfig(new PropertyTree()).build());

        const persistedDraft = createContent({
            displayName: 'Updated',
            mixins: [new Mixin(new MixinName('app:seo'), new PropertyTree())],
            page: new PageBuilder().setConfig(new PropertyTree()).build(),
        });
        setPersistedContent(persistedDraft);

        expect($wizardSectionChanges.get()).toEqual({
            data: false,
            displayName: false,
            name: false,
            mixins: false,
            page: false,
            workflow: false,
        });
        expect($wizardHasChanges.get()).toBe(false);
    });

    it('cleans store state on reset', () => {
        const descriptor = createMixinDescriptor('app:seo', true);
        initializeWizardContentState(createContent(), null, [descriptor], WorkflowState.IN_PROGRESS);
        setDraftDisplayName('Updated');
        setContentFormExpanded(false);

        resetWizardContent();

        expect($mixinsDescriptors.get()).toEqual([]);
        expect($wizardDataChangedPaths.get()).toEqual({});
        expect($wizardChangedSections.get()).toEqual([]);
        expect($wizardHasChanges.get()).toBe(false);
        expect($isContentFormExpanded.get()).toBe(true);
    });

    it('sets content form expanded state', () => {
        expect($isContentFormExpanded.get()).toBe(true);

        setContentFormExpanded(false);
        expect($isContentFormExpanded.get()).toBe(false);

        setContentFormExpanded(true);
        expect($isContentFormExpanded.get()).toBe(true);
    });

    it('toggles content form expanded state', () => {
        expect($isContentFormExpanded.get()).toBe(true);

        toggleContentFormExpanded();
        expect($isContentFormExpanded.get()).toBe(false);

        toggleContentFormExpanded();
        expect($isContentFormExpanded.get()).toBe(true);
    });

    it('marks data as changed when draft PropertyTree is mutated in-place', () => {
        const persistedData = new PropertyTree();
        persistedData.addString('title', 'Original');
        initializeWizardContentState(createContent({data: persistedData}), null, [], WorkflowState.IN_PROGRESS);

        const draftData = $wizardDraftData.get();
        draftData.setStringByPath(PropertyPath.fromString('title'), 'Mutated');

        expect($wizardSectionChanges.get().data).toBe(true);
        expect($wizardHasChanges.get()).toBe(true);
    });

    it('marks mixins as changed when mixin PropertyTree is mutated in-place', () => {
        const descriptor = createMixinDescriptor('app:seo', true);
        const mixin = new Mixin(new MixinName('app:seo'), new PropertyTree());
        initializeWizardContentState(createContent({mixins: [mixin]}), null, [descriptor], WorkflowState.IN_PROGRESS);

        const draftMixin = $wizardDraftMixins.get().find((m) => m.getName().toString() === 'app:seo');
        draftMixin.getData().addString('title', 'SEO Title');

        expect($wizardSectionChanges.get().mixins).toBe(true);
        expect($wizardHasChanges.get()).toBe(true);
    });

    it('marks mixins as changed when any of multiple mixin PropertyTrees is mutated in-place', () => {
        const seoDescriptor = createMixinDescriptor('app:seo', true);
        const ogDescriptor = createMixinDescriptor('app:og', true);
        const seoMixin = new Mixin(new MixinName('app:seo'), new PropertyTree());
        const ogMixin = new Mixin(new MixinName('app:og'), new PropertyTree());
        initializeWizardContentState(
            createContent({mixins: [seoMixin, ogMixin]}),
            null,
            [seoDescriptor, ogDescriptor],
            WorkflowState.IN_PROGRESS,
        );

        const draftOg = $wizardDraftMixins.get().find((m) => m.getName().toString() === 'app:og');
        draftOg.getData().addString('image', 'og-image.png');

        expect($wizardSectionChanges.get().mixins).toBe(true);
        expect($wizardChangedSections.get()).toContain('mixins');
    });

    it('marks mixins as changed when a re-enabled mixin PropertyTree is mutated in-place', () => {
        const descriptor = createMixinDescriptor('app:seo', true);
        const mixin = new Mixin(new MixinName('app:seo'), new PropertyTree());
        initializeWizardContentState(createContent({mixins: [mixin]}), null, [descriptor], WorkflowState.IN_PROGRESS);

        setDraftMixinEnabled('app:seo', false);
        expect($wizardSectionChanges.get().mixins).toBe(true);

        setDraftMixinEnabled('app:seo', true);
        expect($wizardSectionChanges.get().mixins).toBe(false);

        const draftMixin = $wizardDraftMixins.get().find((m) => m.getName().toString() === 'app:seo');
        draftMixin.getData().addString('title', 'SEO Title');

        expect($wizardSectionChanges.get().mixins).toBe(true);
        expect($wizardHasChanges.get()).toBe(true);
    });
});
