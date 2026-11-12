import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { fetchPermittedActions } from './permittedActions.api';

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
});

describe('fetchPermittedActions', () => {
    it('should POST the content ids and the permissions to check', async () => {
        mockFetch.mockResolvedValue(jsonResponse(['CREATE', 'MODIFY']));

        const result = await fetchPermittedActions(['a', 'b'], ['CREATE', 'DELETE', 'PUBLISH', 'MODIFY']);

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/allowedActions');
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body)).toEqual({
            contentIds: ['a', 'b'],
            permissions: ['CREATE', 'DELETE', 'PUBLISH', 'MODIFY'],
        });
        expect(result._unsafeUnwrap()).toEqual(['CREATE', 'MODIFY']);
    });

    it('should check the root when no content ids are given', async () => {
        mockFetch.mockResolvedValue(jsonResponse(['CREATE']));

        await fetchPermittedActions([], ['CREATE']);

        expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({ contentIds: [], permissions: ['CREATE'] });
    });

    it('should return an error on a failed response', async () => {
        mockFetch.mockResolvedValue(errorResponse(500));

        const result = await fetchPermittedActions([], ['CREATE']);

        expect(result.isErr()).toBe(true);
    });
});
