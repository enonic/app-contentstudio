import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { fetchLocales } from './locales.api';

vi.mock('@enonic/lib-admin-ui/locale/Locale', () => ({
    Locale: {
        fromJson: (json: { id: string; displayName: string }) => ({
            getId: () => json.id,
            getDisplayName: () => json.displayName,
        }),
    },
}));

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
});

afterEach(() => {
    restoreFetch();
});

describe('fetchLocales', () => {
    it('should GET the locales endpoint without params and sort locales by display name', async () => {
        mockFetch.mockResolvedValue(
            jsonResponse({
                locales: [
                    { id: 'no', displayName: 'Norwegian' },
                    { id: 'en', displayName: 'English' },
                ],
            }),
        );

        const result = await fetchLocales();

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/content/locales');
        expect(url).not.toContain('?');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().map((locale) => locale.getId())).toEqual(['en', 'no']);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchLocales();

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
