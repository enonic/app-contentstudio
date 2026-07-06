import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { AppError } from '../../../shared/api/errors';
import { $config } from '../../../shared/config/config.store';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { fetchExtensions } from './extensions.api';

vi.mock('@enonic/lib-admin-ui/extension/Extension', () => ({
    Extension: { fromJson: (json: unknown) => ({ extensionFrom: json }) },
}));

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    $config.setKey('extensionApiUrl', '/admin/api/extension');
});

afterEach(() => {
    restoreFetch();
});

describe('fetchExtensions', () => {
    it('should GET the extension api with the interface param and parse each descriptor', async () => {
        mockFetch.mockResolvedValue(jsonResponse([{ key: 'w-1' }, { key: 'w-2' }]));

        const result = await fetchExtensions('contentstudio.menuitem');

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toBe('/admin/api/extension?interface=contentstudio.menuitem');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([{ extensionFrom: { key: 'w-1' } }, { extensionFrom: { key: 'w-2' } }]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchExtensions('contentstudio.liveview');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
