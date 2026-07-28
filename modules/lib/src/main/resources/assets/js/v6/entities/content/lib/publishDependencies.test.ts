import { err } from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../app/content/ContentId';
import { createResolveResult } from '../../../shared/lib/test/dialog.store.test.utils';
import { resolveAppliedPublishDependencies } from './publishDependencies';

const { mockResolvePublishDependencies } = vi.hoisted(() => ({
    mockResolvePublishDependencies: vi.fn(),
}));

vi.mock('../api/publish.api', () => ({
    resolvePublishDependencies: mockResolvePublishDependencies,
}));

const ids = [new ContentId('item-1')];
const excludeChildrenIds = [new ContentId('item-1')];

describe('resolveAppliedPublishDependencies', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should make a single request and reuse it for both passes when nothing is excluded', async () => {
        mockResolvePublishDependencies.mockResolvedValue(createResolveResult({ dependants: [new ContentId('dep-1')] }));

        const result = await resolveAppliedPublishDependencies({ ids, excludeChildrenIds, excludedIds: [] });

        expect(result.isOk()).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
        expect(mockResolvePublishDependencies).toHaveBeenCalledWith({ ids, excludeChildrenIds });

        const { maxResult, minResult } = result._unsafeUnwrap();
        expect(maxResult).toBe(minResult);
    });

    it('should add an excluded pass that re-evaluates required items', async () => {
        const excludedIds = [new ContentId('dep-2')];
        mockResolvePublishDependencies.mockImplementation(({ excludedIds: excluded = [] }) =>
            Promise.resolve(
                createResolveResult({
                    dependants: [new ContentId('dep-1'), new ContentId('dep-2')],
                    required: excluded.length > 0 ? [] : [new ContentId('dep-1')],
                }),
            ),
        );

        const result = await resolveAppliedPublishDependencies({ ids, excludeChildrenIds, excludedIds });

        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
        // The first pass stays exclusion-free so the excluded row remains re-includable.
        expect(mockResolvePublishDependencies).toHaveBeenNthCalledWith(1, { ids, excludeChildrenIds });
        expect(mockResolvePublishDependencies).toHaveBeenNthCalledWith(2, { ids, excludeChildrenIds, excludedIds });

        const { maxResult, minResult } = result._unsafeUnwrap();
        expect(maxResult.getRequired()).toHaveLength(1);
        expect(minResult.getRequired()).toHaveLength(0);
    });

    it('should short-circuit when the first pass fails', async () => {
        const error = { message: 'boom' };
        mockResolvePublishDependencies.mockResolvedValue(err(error));

        const result = await resolveAppliedPublishDependencies({
            ids,
            excludeChildrenIds,
            excludedIds: [new ContentId('dep-2')],
        });

        expect(result._unsafeUnwrapErr()).toBe(error);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
    });

    it('should propagate a failure from the excluded pass', async () => {
        const error = { message: 'boom' };
        mockResolvePublishDependencies
            .mockResolvedValueOnce(createResolveResult({ dependants: [new ContentId('dep-1')] }))
            .mockResolvedValueOnce(err(error));

        const result = await resolveAppliedPublishDependencies({
            ids,
            excludeChildrenIds,
            excludedIds: [new ContentId('dep-2')],
        });

        expect(result._unsafeUnwrapErr()).toBe(error);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
    });
});
