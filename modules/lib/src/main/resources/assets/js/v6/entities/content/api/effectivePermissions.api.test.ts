import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { type ContentId } from '../../../../app/content/ContentId';
import { AppError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { fetchEffectivePermissions } from './effectivePermissions.api';

vi.mock('../../../../app/security/EffectivePermission', () => ({
    EffectivePermission: { fromJson: (json: unknown) => ({ permissionFrom: json }) },
}));

const contentId = (id: string): ContentId => ({ toString: () => id }) as ContentId;

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
});

describe('fetchEffectivePermissions', () => {
    it('should GET the effective permissions endpoint with the content id and parse each entry', async () => {
        mockFetch.mockResolvedValue(jsonResponse([{ access: 'FULL' }]));

        const result = await fetchEffectivePermissions(contentId('c-1'));

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/effectivePermissions?id=c-1');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([{ permissionFrom: { access: 'FULL' } }]);
    });

    it('should resolve an empty list for an empty response array', async () => {
        mockFetch.mockResolvedValue(jsonResponse([]));

        const result = await fetchEffectivePermissions(contentId('c-1'));

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchEffectivePermissions(contentId('c-1'));

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
