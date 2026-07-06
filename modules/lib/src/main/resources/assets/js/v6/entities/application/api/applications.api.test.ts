import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { fetchSiteApplications } from './applications.api';

vi.mock('@enonic/lib-admin-ui/application/Application', () => ({
    Application: {
        fromJsonArray: (json: unknown[]) => json.map((item) => ({ appFrom: item })),
    },
}));

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
});

afterEach(() => {
    restoreFetch();
});

describe('fetchSiteApplications', () => {
    it('should GET the getSiteApplications endpoint without params and parse the applications', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ applications: [{ key: 'com.app.one' }] }));

        const result = await fetchSiteApplications();

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/application/getSiteApplications');
        expect(url).not.toContain('?');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([{ appFrom: { key: 'com.app.one' } }]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchSiteApplications();

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
