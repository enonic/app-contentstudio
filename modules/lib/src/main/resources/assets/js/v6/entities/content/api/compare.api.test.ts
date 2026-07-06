import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { compareContent } from './compare.api';

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
});

describe('compareContent', () => {
    it('should POST the content ids to the compare endpoint and map the results', async () => {
        mockFetch.mockResolvedValue(
            jsonResponse({
                compareContentResults: [
                    { id: 'a', diff: ['data'] },
                    { id: 'b', diff: [] },
                ],
            }),
        );

        const result = await compareContent(['a', 'b']);

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/compare');
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body)).toEqual({ ids: ['a', 'b'] });

        expect(result.isOk()).toBe(true);
        const map = result._unsafeUnwrap();
        expect(map.get('a')).toEqual({ diff: ['data'] });
        expect(map.get('b')).toEqual({ diff: [] });
    });

    it('should short-circuit to an empty map for empty input', async () => {
        const result = await compareContent([]);

        expect(mockFetch).not.toHaveBeenCalled();
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().size).toBe(0);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await compareContent(['a']);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
