import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import { PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { PrincipalType } from '@enonic/lib-admin-ui/security/PrincipalType';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { findPrincipals, resolvePrincipalsByKeys } from './principals.api';

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
});

afterEach(() => {
    restoreFetch();
});

describe('findPrincipals', () => {
    it('should GET the principals endpoint with joined types and size, omitting the empty query', async () => {
        mockFetch.mockResolvedValue(
            jsonResponse({ principals: [{ key: 'role:cms.admin', displayName: 'Admin' }], totalSize: 1 }),
        );

        const result = await findPrincipals({
            types: [PrincipalType.USER, PrincipalType.GROUP, PrincipalType.ROLE],
            query: '',
            size: 50,
        });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/security/principals?types=USER%2CGROUP%2CROLE&size=50');
        expect(url).not.toContain('query=');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().map((principal) => principal.getKey().toString())).toEqual(['role:cms.admin']);
    });

    it('should include the encoded search query when given', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ principals: [], totalSize: 0 }));

        await findPrincipals({ types: [PrincipalType.USER], query: 'jo hn', size: 20 });

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/security/principals?types=USER&query=jo+hn&size=20');
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await findPrincipals({ types: [PrincipalType.USER], size: 10 });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('resolvePrincipalsByKeys', () => {
    it('should POST the keys to the resolveByKeys endpoint and parse the principals', async () => {
        mockFetch.mockResolvedValue(jsonResponse([{ key: 'user:system:su', displayName: 'SU' }]));

        const result = await resolvePrincipalsByKeys([PrincipalKey.fromString('user:system:su')]);

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/security/principals/resolveByKeys');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ keys: ['user:system:su'], memberships: false }),
        });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().map((principal) => principal.getKey().toString())).toEqual(['user:system:su']);
    });

    it('should short-circuit to an empty list without fetching for empty input', async () => {
        const result = await resolvePrincipalsByKeys([]);

        expect(mockFetch).not.toHaveBeenCalled();
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await resolvePrincipalsByKeys([PrincipalKey.fromString('user:system:su')]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
