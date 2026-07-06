import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { AppError } from '../../../shared/api/errors';
import { $config } from '../../../shared/config/config.store';
import { jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { exportContent, fetchExports, importContent } from './importContent.api';

vi.mock('../../../../app/repository/RepositoryId', () => ({
    RepositoryId: { fromCurrentProject: () => ({ toString: () => 'com.enonic.cms.myrepo' }) },
}));

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    $config.setKey('services', { ...$config.get().services, importContentUrl: 'https://cs/service/import' });
});

afterEach(() => {
    restoreFetch();
});

describe('fetchExports', () => {
    it('should GET the list action scoped to the current repository and return the exports', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ exports: ['a', 'b'] }));

        const result = await fetchExports();

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(['a', 'b']);
        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('https://cs/service/import?');
        expect(url).toContain('action=list');
        expect(url).toContain('repository=com.enonic.cms.myrepo');
    });

    it('should resolve with an empty array when there are no exports', async () => {
        mockFetch.mockResolvedValue(jsonResponse({}));

        const result = await fetchExports();

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([]);
    });

    it('should surface the server error message as an AppError', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ message: 'Import service unavailable' }, { status: 500 }));

        const result = await fetchExports();

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
        expect(result._unsafeUnwrapErr().message).toBe('Import service unavailable');
    });
});

describe('exportContent', () => {
    it('should POST the export action with the content id and optional name', async () => {
        mockFetch.mockResolvedValue(
            jsonResponse({ exportName: 'exp', exportedNodes: [], exportedBinaries: [], exportErrors: [] }),
        );

        const result = await exportContent('c-1', { name: 'my-export' });

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().exportName).toBe('exp');
        const [url, init] = mockFetch.mock.calls[0];
        expect(init).toMatchObject({ method: 'POST' });
        expect(url).toContain('action=export');
        expect(url).toContain('contentId=c-1');
        expect(url).toContain('name=my-export');
    });
});

describe('importContent', () => {
    it('should POST the import action with content id, export name, and keepPublishFirst', async () => {
        mockFetch.mockResolvedValue(
            jsonResponse({
                addedNodes: [],
                updatedNodes: [],
                skippedNodes: [],
                importedBinaries: [],
                importErrors: [],
            }),
        );

        const result = await importContent('c-1', 'exp', { keepPublishFirst: true });

        expect(result.isOk()).toBe(true);
        const [url, init] = mockFetch.mock.calls[0];
        expect(init).toMatchObject({ method: 'POST' });
        expect(url).toContain('action=import');
        expect(url).toContain('contentId=c-1');
        expect(url).toContain('exportName=exp');
        expect(url).toContain('keepPublishFirst=true');
    });
});
