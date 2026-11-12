import { atom } from 'nanostores';
import { okAsync, ResultAsync } from 'neverthrow';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentSummary } from '../../../../app/content/ContentSummary';

const mocks = vi.hoisted(() => ({
    fetchPermittedActions: vi.fn(),
    fetchAllowsChildContent: vi.fn(),
    hasUnpublishedChildren: vi.fn(),
    projectChangedHandlers: [] as (() => void)[],
}));

const stores = vi.hoisted(() => ({}) as { $currentItems: ReturnType<typeof atom<ContentSummary[]>> });

vi.mock('../../../entities/content', async () => {
    const { atom: createAtom } = await import('nanostores');
    stores.$currentItems = createAtom<ContentSummary[]>([]);

    return {
        $currentItems: stores.$currentItems,
        hasUnpublishedChildren: mocks.hasUnpublishedChildren,
    };
});

vi.mock('../../../entities/content/api/permittedActions.api', () => ({
    fetchPermittedActions: mocks.fetchPermittedActions,
}));

vi.mock('../../../entities/schema', () => ({
    fetchAllowsChildContent: mocks.fetchAllowsChildContent,
    clearAllowsChildContentCache: vi.fn(),
}));

vi.mock('../../../entities/application', () => ({
    onApplicationEvent: () => () => undefined,
}));

vi.mock('../../../entities/project', async () => {
    const { atom: createAtom } = await import('nanostores');

    return {
        $noProjectMode: createAtom(false),
        onActiveProjectChanged: (handler: () => void) => {
            mocks.projectChangedHandlers.push(handler);
            return () => undefined;
        },
    };
});

vi.mock('../../../../app/settings/data/project/ProjectHelper', () => ({
    ProjectHelper: { canRequestPublish: () => true },
}));

vi.mock('./browseActions.store', async () => {
    const { atom: createAtom } = await import('nanostores');

    return {
        $browseActionFacts: createAtom({ items: [], permissions: [] }),
        isBrowseActionsStashed: () => false,
        needsChildrenAllowedCheck: ({ items }: { items: unknown[] }) => items.length === 1,
        needsUnpublishedChildrenCheck: () => false,
    };
});

import { emitContentPublished } from '../../../shared/socket/socket.store';
import { start, stop } from './browseActions.service';
import { $browseActionFacts } from './browseActions.store';

const createItem = (id: string): ContentSummary =>
    ({
        getId: () => id,
        getType: () => ({ toString: () => 'app:type', getLocalName: () => 'type' }),
    }) as unknown as ContentSummary;

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('browseActions.service', () => {
    beforeEach(() => {
        stores.$currentItems.set([]);
        $browseActionFacts.set({ items: [], permissions: [] });
        mocks.fetchPermittedActions.mockReset().mockReturnValue(okAsync(['CREATE']));
        mocks.fetchAllowsChildContent.mockReset().mockReturnValue(okAsync(true));
        mocks.hasUnpublishedChildren.mockReset().mockReturnValue(okAsync(new Map()));
        mocks.projectChangedHandlers.length = 0;
    });

    afterEach(() => {
        stop();
    });

    it('should check the root permissions on start', async () => {
        start();
        await flush();

        expect(mocks.fetchPermittedActions).toHaveBeenCalledWith([], ['CREATE']);
        expect($browseActionFacts.get()).toEqual({ items: [], permissions: ['CREATE'] });
    });

    it('should check the item permissions and the content type when the current items change', async () => {
        start();
        const item = createItem('a');
        mocks.fetchPermittedActions.mockReturnValue(okAsync(['CREATE', 'MODIFY']));
        mocks.fetchAllowsChildContent.mockReturnValue(okAsync(false));

        stores.$currentItems.set([item]);
        await flush();

        expect(mocks.fetchPermittedActions).toHaveBeenLastCalledWith(['a'], ['CREATE', 'DELETE', 'PUBLISH', 'MODIFY']);
        expect(mocks.fetchAllowsChildContent).toHaveBeenCalledWith('app:type');
        expect($browseActionFacts.get()).toEqual({
            items: [item],
            permissions: ['CREATE', 'MODIFY'],
            childrenAllowed: false,
        });
    });

    it('should not ask again when the store hands out the same items in a new array', async () => {
        start();
        const item = createItem('a');
        stores.$currentItems.set([item]);
        await flush();
        const calls = mocks.fetchPermittedActions.mock.calls.length;

        stores.$currentItems.set([item]);
        await flush();

        expect(mocks.fetchPermittedActions).toHaveBeenCalledTimes(calls);
    });

    it('should drop the answer for items that are no longer current', async () => {
        start();
        await flush();
        let resolveStale: (permissions: string[]) => void = () => undefined;
        mocks.fetchPermittedActions.mockReturnValueOnce(
            ResultAsync.fromSafePromise(new Promise<string[]>((resolve) => (resolveStale = resolve))),
        );
        const stale = createItem('stale');
        const current = createItem('current');

        stores.$currentItems.set([stale]);
        mocks.fetchPermittedActions.mockReturnValue(okAsync(['CREATE']));
        stores.$currentItems.set([current]);
        await flush();
        resolveStale(['CREATE', 'DELETE', 'PUBLISH', 'MODIFY']);
        await flush();

        expect($browseActionFacts.get().items).toEqual([current]);
        expect($browseActionFacts.get().permissions).toEqual(['CREATE']);
    });

    it('should ask again after a content change elsewhere while something is current', async () => {
        vi.useFakeTimers();
        start();
        stores.$currentItems.set([createItem('parent')]);
        await vi.advanceTimersByTimeAsync(0);
        const calls = mocks.fetchPermittedActions.mock.calls.length;

        emitContentPublished([createItem('child')]);
        emitContentPublished([createItem('other-child')]);
        await vi.advanceTimersByTimeAsync(300);

        expect(mocks.fetchPermittedActions).toHaveBeenCalledTimes(calls + 1);
        vi.useRealTimers();
    });

    it('should ignore content changes while nothing is current', async () => {
        vi.useFakeTimers();
        start();
        await vi.advanceTimersByTimeAsync(0);
        const calls = mocks.fetchPermittedActions.mock.calls.length;

        emitContentPublished([createItem('child')]);
        await vi.advanceTimersByTimeAsync(300);

        expect(mocks.fetchPermittedActions).toHaveBeenCalledTimes(calls);
        vi.useRealTimers();
    });

    it('should ask again when the active project changes', async () => {
        start();
        await flush();
        const calls = mocks.fetchPermittedActions.mock.calls.length;

        mocks.projectChangedHandlers.forEach((handler) => handler());
        await flush();

        expect(mocks.fetchPermittedActions).toHaveBeenCalledTimes(calls + 1);
    });
});
