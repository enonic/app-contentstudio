import { describe, expect, it, vi } from 'vitest';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { ContentPermission } from '../../../entities/content/api/permittedActions.api';

vi.mock('../../../shared/lib/cms/content/status', () => ({
    isOnline: (item: { online?: boolean }) => item.online === true,
    isPublished: (item: { published?: boolean }) => item.published === true,
}));

import {
    type BrowseActionEnvironment,
    type BrowseActionFacts,
    needsChildrenAllowedCheck,
    needsUnpublishedChildrenCheck,
    resolveBrowseActions,
} from './browseActions.store';

type ItemOptions = {
    online?: boolean;
    published?: boolean;
    valid?: boolean;
    ready?: boolean;
    inProgress?: boolean;
    children?: boolean;
    deletable?: boolean;
    editable?: boolean;
    readOnly?: boolean;
    pageTemplate?: boolean;
};

const createItem = ({
    online = false,
    published = false,
    valid = true,
    ready = false,
    inProgress = false,
    children = false,
    deletable = true,
    editable = true,
    readOnly = false,
    pageTemplate = false,
}: ItemOptions = {}): ContentSummary =>
    ({
        online,
        published,
        isValid: () => valid,
        isReady: () => ready,
        isInProgress: () => inProgress,
        hasChildren: () => children,
        isDeletable: () => deletable,
        isEditable: () => editable,
        isReadOnly: () => readOnly,
        getType: () => ({ isPageTemplate: () => pageTemplate }),
    }) as unknown as ContentSummary;

const ALL: ContentPermission[] = ['CREATE', 'DELETE', 'PUBLISH', 'MODIFY'];

const ENV: BrowseActionEnvironment = {
    stashed: false,
    noProject: false,
    previewResolved: true,
    canRequestPublish: true,
};

const resolve = (facts: Partial<BrowseActionFacts>, env: Partial<BrowseActionEnvironment> = {}) =>
    resolveBrowseActions({ items: [], permissions: ALL, ...facts }, { ...ENV, ...env });

describe('resolveBrowseActions', () => {
    it('should offer only New, Create issue and Search when nothing is selected', () => {
        const actions = resolve({ permissions: ['CREATE'] });
        const enabled = Object.entries(actions)
            .filter(([, state]) => state.enabled)
            .map(([id]) => id);

        expect(enabled).toEqual(['new', 'createIssue', 'search']);
        expect(actions.publish.visible).toBe(true);
        expect(actions.unpublish.visible).toBe(false);
    });

    it('should disable New without the create permission', () => {
        expect(resolve({ permissions: [] }).new.enabled).toBe(false);
    });

    it('should enable the item actions for a single offline valid item', () => {
        const actions = resolve({ items: [createItem()] });

        expect(actions.new.enabled).toBe(true);
        expect(actions.edit.enabled).toBe(true);
        expect(actions.archive.enabled).toBe(true);
        expect(actions.duplicate.enabled).toBe(true);
        expect(actions.move.enabled).toBe(true);
        expect(actions.sort.enabled).toBe(true);
        expect(actions.preview.enabled).toBe(true);
        expect(actions.publish).toMatchObject({ enabled: true, visible: true });
        expect(actions.markAsReady.enabled).toBe(true);
        expect(actions.requestPublish.enabled).toBe(true);
        expect(actions.unpublish).toMatchObject({ enabled: false, visible: false });
        expect(actions.publishTree.enabled).toBe(false);
    });

    it('should disable New and Sort for several items', () => {
        const actions = resolve({ items: [createItem(), createItem()] });

        expect(actions.new.enabled).toBe(false);
        expect(actions.sort.enabled).toBe(false);
        expect(actions.duplicate.enabled).toBe(true);
    });

    it('should hide Publish and show Unpublish for an online item', () => {
        const actions = resolve({ items: [createItem({ online: true, published: true, ready: true })] });

        expect(actions.publish).toMatchObject({ enabled: false, visible: false });
        expect(actions.unpublish).toMatchObject({ enabled: true, visible: true });
        expect(actions.markAsReady.enabled).toBe(false);
        expect(actions.requestPublish.enabled).toBe(false);
    });

    it('should label Edit as Open when every item is read-only', () => {
        expect(resolve({ items: [createItem({ readOnly: true })] }).edit.labelKey).toBe('action.open');
        expect(resolve({ items: [createItem({ readOnly: true }), createItem()] }).edit.labelKey).toBe('action.edit');
        expect(resolve({}).edit.labelKey).toBe('action.edit');
    });

    it('should disable New for a page template', () => {
        expect(resolve({ items: [createItem({ pageTemplate: true })] }).new.enabled).toBe(false);
    });

    it('should disable New and Sort when the content type allows no children', () => {
        const actions = resolve({ items: [createItem()], childrenAllowed: false });

        expect(actions.new.enabled).toBe(false);
        expect(actions.sort.enabled).toBe(false);
    });

    it('should disable publishing but keep Publish visible when the content type is missing', () => {
        const actions = resolve({ items: [createItem({ children: true })], contentTypeMissing: true });

        expect(actions.publish).toMatchObject({ enabled: false, visible: true });
        expect(actions.publishTree.enabled).toBe(false);
    });

    it('should keep Publish tree enabled until the children check says otherwise', () => {
        const items = [createItem({ children: true })];

        expect(resolve({ items }).publishTree.enabled).toBe(true);
        expect(resolve({ items, hasUnpublishedChildren: true }).publishTree.enabled).toBe(true);
        expect(resolve({ items, hasUnpublishedChildren: false }).publishTree.enabled).toBe(false);
    });

    it('should enable Request publish for online items with unpublished children', () => {
        const items = [createItem({ online: true, published: true, children: true })];

        expect(resolve({ items }).requestPublish.enabled).toBe(false);
        expect(resolve({ items, hasUnpublishedChildren: true }).requestPublish.enabled).toBe(true);
        expect(
            resolve({ items, hasUnpublishedChildren: true }, { canRequestPublish: false }).requestPublish.enabled,
        ).toBe(false);
    });

    it('should not publish an item in progress without the modify permission', () => {
        const items = [createItem({ inProgress: true })];

        expect(resolve({ items, permissions: ['PUBLISH'] }).publish.enabled).toBe(false);
        expect(resolve({ items, permissions: ['PUBLISH', 'MODIFY'] }).publish.enabled).toBe(true);
    });

    it('should hold back everything but New and Search while stashed', () => {
        const actions = resolve({ items: [createItem()] }, { stashed: true });
        const enabled = Object.entries(actions)
            .filter(([, state]) => state.enabled)
            .map(([id]) => id);

        expect(enabled).toEqual(['new', 'search']);
    });

    it('should disable every action without a project', () => {
        const actions = resolve({ items: [createItem()] }, { noProject: true });

        expect(Object.values(actions).some((state) => state.enabled)).toBe(false);
    });

    it('should disable Preview until the preview is resolved', () => {
        expect(resolve({ items: [createItem()] }, { previewResolved: false }).preview.enabled).toBe(false);
    });
});

describe('needsChildrenAllowedCheck', () => {
    it('should ask only for a single item the user may create under', () => {
        expect(needsChildrenAllowedCheck({ items: [createItem()], permissions: ALL })).toBe(true);
        expect(needsChildrenAllowedCheck({ items: [createItem()], permissions: ['MODIFY'] })).toBe(false);
        expect(needsChildrenAllowedCheck({ items: [createItem(), createItem()], permissions: ALL })).toBe(false);
        expect(needsChildrenAllowedCheck({ items: [], permissions: ALL })).toBe(false);
    });
});

describe('needsUnpublishedChildrenCheck', () => {
    it('should skip items without children', () => {
        expect(needsUnpublishedChildrenCheck({ items: [createItem()], permissions: ALL }, true)).toBe(false);
    });

    it('should ask when Publish tree is possible', () => {
        expect(needsUnpublishedChildrenCheck({ items: [createItem({ children: true })], permissions: ALL }, true)).toBe(
            true,
        );
    });

    it('should ask for online items only when the user may request publishing', () => {
        const facts: BrowseActionFacts = {
            items: [createItem({ online: true, children: true })],
            permissions: ['CREATE'],
        };

        expect(needsUnpublishedChildrenCheck(facts, true)).toBe(true);
        expect(needsUnpublishedChildrenCheck(facts, false)).toBe(false);
    });
});
