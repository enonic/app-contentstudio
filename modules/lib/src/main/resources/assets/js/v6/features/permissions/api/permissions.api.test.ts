import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import { AccessControlList } from '../../../../app/access/AccessControlList';
import { type ContentPath } from '../../../../app/content/ContentPath';
import { type ContentId } from '../../../../app/content/ContentId';
import { AppError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { applyContentPermissions, fetchRootPermissions, getDescendantsOfContents } from './permissions.api';

const contentPath = (path: string): ContentPath => ({ toString: () => path }) as ContentPath;
const contentId = (id: string): ContentId => ({ toString: () => id }) as ContentId;

const aclJson = {
    permissions: [{ principal: { key: 'role:cms.admin', displayName: 'Admin' }, allow: ['READ'], deny: [] }],
};

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
});

describe('getDescendantsOfContents', () => {
    it('should POST the content paths and parse the descendant ids', async () => {
        mockFetch.mockResolvedValue(jsonResponse([{ id: 'child-1' }, { id: 'child-2' }]));

        const result = await getDescendantsOfContents([contentPath('/a')]);

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/getDescendantsOfContents');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contentPaths: ['/a'] }),
        });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().map((id) => id.toString())).toEqual(['child-1', 'child-2']);
    });

    it('should short-circuit to an empty list without fetching for empty input', async () => {
        const result = await getDescendantsOfContents([]);

        expect(mockFetch).not.toHaveBeenCalled();
        expect(result._unsafeUnwrap()).toEqual([]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await getDescendantsOfContents([contentPath('/a')]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('fetchRootPermissions', () => {
    it('should GET the root permissions endpoint without params and parse the entries', async () => {
        mockFetch.mockResolvedValue(jsonResponse(aclJson));

        const result = await fetchRootPermissions();

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/rootPermissions');
        expect(url).not.toContain('?');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        const entries = result._unsafeUnwrap().getEntries();
        expect(entries).toHaveLength(1);
        expect(entries[0].getPrincipalKey().toString()).toBe('role:cms.admin');
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchRootPermissions();

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('applyContentPermissions', () => {
    it('should POST replace-all permissions with an uppercased scope and parse the task id', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ taskId: 't-perm' }));

        const result = await applyContentPermissions({
            contentId: contentId('c-1'),
            scope: 'tree',
            permissions: AccessControlList.fromJson(aclJson),
        });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/applyPermissions');
        expect(init.method).toBe('POST');

        const body = JSON.parse(init.body);
        expect(Object.keys(body)).toEqual(['contentId', 'permissions', 'scope']);
        expect(body.contentId).toBe('c-1');
        expect(body.scope).toBe('TREE');
        expect(body.permissions).toHaveLength(1);
        expect(body.permissions[0]).toMatchObject({ allow: ['READ'], deny: [] });
        expect(body.permissions[0].principal.key).toBe('role:cms.admin');

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().toString()).toBe('t-perm');
    });

    it('should POST add and remove permission lists for the merge branch', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ taskId: 't-perm' }));

        await applyContentPermissions({
            contentId: contentId('c-1'),
            scope: 'single',
            addPermissions: AccessControlList.fromJson(aclJson),
            removePermissions: AccessControlList.fromJson({ permissions: [] }),
        });

        const [, init] = mockFetch.mock.calls[0];
        const body = JSON.parse(init.body);
        expect(Object.keys(body)).toEqual(['contentId', 'addPermissions', 'removePermissions', 'scope']);
        expect(body.addPermissions).toHaveLength(1);
        expect(body.removePermissions).toEqual([]);
        expect(body.scope).toBe('SINGLE');
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await applyContentPermissions({ contentId: contentId('c-1'), scope: 'single' });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
