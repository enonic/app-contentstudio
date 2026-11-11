import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import { AppError } from '@enonic/ui-utils';
import { type ContentId } from '../../../../app/content/ContentId';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { fetchAllContentTypes, fetchContentTypesByContent, fetchCreatableContentTypes } from './contentTypes.api';

const typeJson = { name: 'my:type', title: 'My type', description: 'd', iconUrl: '/icon', abstract: false };
const parsedType = { name: 'my:type', title: 'My type', description: 'd', iconUrl: '/icon', abstract: false };

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

describe('fetchAllContentTypes', () => {
    it('should GET the non-project schema endpoint and parse the content types', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contentTypes: [typeJson] }));

        const result = await fetchAllContentTypes();

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/schema/content/all');
        expect(url).not.toContain('/cms/');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([parsedType]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchAllContentTypes();

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('fetchContentTypesByContent', () => {
    it('should GET the project-scoped byContent endpoint with the content id', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contentTypes: [typeJson] }));

        const result = await fetchContentTypesByContent(contentId('c-1'));

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/schema/content/byContent?contentId=c-1');
        expect(url).not.toContain('/content/content/');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([parsedType]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchContentTypesByContent(contentId('c-1'));

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('fetchCreatableContentTypes', () => {
    it('should POST the content id and the allowed types to the project-scoped filter endpoint', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contentTypes: [typeJson] }));

        const result = await fetchCreatableContentTypes({
            contentId: contentId('c-1'),
            allowedContentTypes: ['my:type'],
            applicationKey: 'my',
            projectName: 'other-project',
        });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/other-project/content/schema/filter/contentTypes');
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body)).toEqual({
            contentId: 'c-1',
            allowedContentTypes: ['my:type'],
            applicationKey: 'my',
        });
        expect(result._unsafeUnwrap()).toEqual([parsedType]);
    });

    it('should fall back to the active project and omit a missing content id', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contentTypes: [] }));

        await fetchCreatableContentTypes({});

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/schema/filter/contentTypes');
        expect(JSON.parse(init.body)).toEqual({});
    });
});
