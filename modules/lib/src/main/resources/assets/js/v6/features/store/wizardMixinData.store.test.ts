import {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ContentBuilder, type Content} from '../../../app/content/Content';
import {ContentName} from '../../../app/content/ContentName';
import {Mixin} from '../../../app/content/Mixin';
import {MixinName} from '../../../app/content/MixinName';
import {Workflow} from '../../../app/content/Workflow';
import {WorkflowState} from '../../../app/content/WorkflowState';
import {$wizardSectionChanges, initializeWizardContentState, resetWizardContent} from './wizardContent.store';
import {getMixinDataContext} from './wizardMixinData.store';

function createContentWithMixins(mixins: Mixin[]): Content {
    const workflow = Workflow.create().setState(WorkflowState.IN_PROGRESS).build();
    const builder = new ContentBuilder();

    builder.setData(new PropertyTree());
    builder.setName(new ContentName('content'));
    builder.setType(ContentTypeName.UNSTRUCTURED);
    builder.setDisplayName('Content');
    builder.setMixins(mixins);
    builder.setWorkflow(workflow);

    return builder.build();
}

function createMixin(name: string, data: PropertyTree): Mixin {
    return new Mixin(new MixinName(name), data);
}

describe('wizardMixinData.store', () => {
    beforeEach(() => {
        resetWizardContent();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('bumps changed-path version for repeated dirty edits and clears it on revert', () => {
        const mixinData = new PropertyTree();
        mixinData.addString('title', 'Original');
        const content = createContentWithMixins([createMixin('app:seo', mixinData)]);
        initializeWizardContentState(content, null, [], WorkflowState.IN_PROGRESS);

        const context = getMixinDataContext('app:seo');
        const path = PropertyPath.fromString('title');

        context.setDraftStringByPath(path, 'First');
        expect(context.$changedPaths.get().title).toBe(1);

        context.setDraftStringByPath(path, 'Second');
        expect(context.$changedPaths.get().title).toBe(2);

        context.setDraftStringByPath(path, 'Original');
        expect(context.$changedPaths.get().title).toBeUndefined();
    });

    it('restores unchanged state when persisted value is explicit empty string', () => {
        const mixinData = new PropertyTree();
        mixinData.setStringByPath(PropertyPath.fromString('title'), '');
        const content = createContentWithMixins([createMixin('app:seo', mixinData)]);
        initializeWizardContentState(content, null, [], WorkflowState.IN_PROGRESS);

        const context = getMixinDataContext('app:seo');
        const path = PropertyPath.fromString('title');

        context.setDraftStringByPath(path, 'x');
        expect(context.$changedPaths.get().title).toBe(1);

        context.setDraftStringByPath(path, '');
        expect(context.$changedPaths.get().title).toBeUndefined();
    });

    it('tracks occurrence add/remove and clears changed paths when back to persisted', () => {
        const mixinData = new PropertyTree();
        mixinData.addString('keywords', 'a');
        mixinData.addString('keywords', 'b');
        const content = createContentWithMixins([createMixin('app:seo', mixinData)]);
        initializeWizardContentState(content, null, [], WorkflowState.IN_PROGRESS);

        const context = getMixinDataContext('app:seo');
        const path = PropertyPath.fromString('keywords');

        context.addOccurrence(path, 2);
        expect(context.$changedPaths.get().keywords).toBe(1);

        context.removeOccurrence(path, 2);
        expect(context.$changedPaths.get().keywords).toBeUndefined();

        resetWizardContent();
        expect(context.$changedPaths.get()).toEqual({});
    });

    it('clears data change after remove/add roundtrip when resulting occurrences match persisted', () => {
        const mixinData = new PropertyTree();
        mixinData.addString('keywords', 'a');
        mixinData.addString('keywords', 'b');
        mixinData.addString('keywords', 'c');
        const content = createContentWithMixins([createMixin('app:seo', mixinData)]);
        initializeWizardContentState(content, null, [], WorkflowState.IN_PROGRESS);

        const context = getMixinDataContext('app:seo');
        const path = PropertyPath.fromString('keywords');

        context.removeOccurrence(path, 1);
        context.addOccurrence(path, 2);
        context.setDraftStringByPath(PropertyPath.fromString('keywords[1]'), 'b');
        context.setDraftStringByPath(PropertyPath.fromString('keywords[2]'), 'c');

        const draftData = context.$draftData.get();
        expect(draftData?.toJson()).toEqual(mixinData.toJson());
        expect($wizardSectionChanges.get().mixins).toBe(false);
    });

    it('clears change when newly added occurrence is removed', () => {
        const mixinData = new PropertyTree();
        mixinData.addString('keywords', 'a');
        mixinData.addString('keywords', 'b');
        const content = createContentWithMixins([createMixin('app:seo', mixinData)]);
        initializeWizardContentState(content, null, [], WorkflowState.IN_PROGRESS);

        const context = getMixinDataContext('app:seo');
        const path = PropertyPath.fromString('keywords');

        context.addOccurrence(path, 2);
        context.removeOccurrence(path, 2);

        const draftData = context.$draftData.get();
        const keywordsArray = draftData?.getRoot().getPropertyArray('keywords');
        expect(keywordsArray?.getSize()).toBe(2);
        expect(keywordsArray?.get(0)?.getString()).toBe('a');
        expect(keywordsArray?.get(1)?.getString()).toBe('b');
        expect(context.$changedPaths.get().keywords).toBeUndefined();
    });

    it('clears base changed-path key when indexed value is cleared to absent', () => {
        const mixinData = new PropertyTree();
        mixinData.addString('keywords', 'a');
        mixinData.addString('keywords', 'b');
        const content = createContentWithMixins([createMixin('app:seo', mixinData)]);
        initializeWizardContentState(content, null, [], WorkflowState.IN_PROGRESS);

        const context = getMixinDataContext('app:seo');
        const path = PropertyPath.fromString('keywords');

        context.addOccurrence(path, 2);
        context.setDraftStringByPath(PropertyPath.fromString('keywords[2]'), 'x');

        context.setDraftStringByPath(PropertyPath.fromString('keywords[2]'), '');

        const draftData = context.$draftData.get();
        const keywordsArray = draftData?.getRoot().getPropertyArray('keywords');
        expect(keywordsArray?.getSize()).toBe(2);
        expect(keywordsArray?.get(0)?.getString()).toBe('a');
        expect(keywordsArray?.get(1)?.getString()).toBe('b');
        expect(context.$changedPaths.get()['keywords[2]']).toBeUndefined();
        expect(context.$changedPaths.get().keywords).toBeUndefined();
    });
});
