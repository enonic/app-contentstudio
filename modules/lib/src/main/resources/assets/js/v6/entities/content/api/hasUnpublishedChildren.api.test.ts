import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { ContentId } from '../../../../app/content/ContentId';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { hasUnpublishedChildren } from './hasUnpublishedChildren.api';

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
});

describe('hasUnpublishedChildren', () => {
    it('should POST the content ids and map the flags by content id', async () => {
        mockFetch.mockResolvedValue(
            jsonResponse({
                contents: [
                    { id: { id: 'a' }, hasChildren: true },
                    { id: { id: 'b' }, hasChildren: false },
                ],
            }),
        );

        const result = await hasUnpublishedChildren([new ContentId('a'), new ContentId('b')]);

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/hasUnpublishedChildren');
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body)).toEqual({ contentIds: ['a', 'b'] });

        expect(result.isOk()).toBe(true);
        const map = result._unsafeUnwrap();
        expect(map.get('a')).toBe(true);
        expect(map.get('b')).toBe(false);
    });

    it('should short-circuit to an empty map for empty input', async () => {
        const result = await hasUnpublishedChildren([]);

        expect(mockFetch).not.toHaveBeenCalled();
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().size).toBe(0);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await hasUnpublishedChildren([new ContentId('a')]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
