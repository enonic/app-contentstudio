import { type ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { Content } from '../../../../app/content/Content';
import type { ContentId } from '../../../../app/content/ContentId';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { loadComponentDescriptor, loadDefaultPageTemplate, loadNearestSite, loadPageTemplate } from './details.api';

const { mockParseContent, mockFromJson } = vi.hoisted(() => ({
    mockParseContent: vi.fn((json: { id: string }) => ({ parsedId: json.id })),
    mockFromJson: vi.fn((json: { key: string }) => ({ key: json.key })),
}));

vi.mock('../../../entities/content/lib/parseContent', () => ({
    parseContent: mockParseContent,
}));

vi.mock('../../../../app/page/Descriptor', () => ({
    Descriptor: { fromJson: mockFromJson },
}));

const contentId = (id: string): ContentId => ({ toString: () => id }) as ContentId;
const contentTypeName = (name: string): ContentTypeName => ({ toString: () => name }) as ContentTypeName;

// Minimal content stub exposing the controller key used to build the cache key + request URL.
const contentWithController = (controllerKey: string): Content =>
    ({
        getPage: () => ({ getController: () => ({ toString: () => controllerKey }) }),
    }) as unknown as Content;

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
    mockParseContent.mockClear();
    mockFromJson.mockClear();
});

describe('loadPageTemplate', () => {
    it('should GET the page/template endpoint with the encoded key and parse the template', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'tpl-1' }));

        const result = await loadPageTemplate(contentId('tpl-1'));

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ parsedId: 'tpl-1' });

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('content/content/page/template');
        expect(url).toContain('key=tpl-1');
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(404, 'Not Found'));

        const result = await loadPageTemplate(contentId('missing'));

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
        expect(mockParseContent).not.toHaveBeenCalled();
    });
});

describe('loadComponentDescriptor', () => {
    it('should GET the page descriptor endpoint with the controller key and parse it', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ key: 'app:ctrl' }));

        const result = await loadComponentDescriptor(contentWithController('app:ctrl'));

        expect(result.isOk()).toBe(true);
        expect((result._unsafeUnwrap() as unknown as { key: string }).key).toBe('app:ctrl');

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('content/page/descriptor');
        expect(url).toContain(`key=${encodeURIComponent('app:ctrl')}`);
    });

    it('should not fetch again on a cache hit', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ key: 'cd-hit' }));

        await loadComponentDescriptor(contentWithController('cd-hit'));
        expect(mockFetch).toHaveBeenCalledTimes(1);

        const second = await loadComponentDescriptor(contentWithController('cd-hit'));
        expect(second.isOk()).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not cache errors and refetch on the next call', async () => {
        mockFetch.mockResolvedValueOnce(errorResponse(500, 'Server Error'));

        const first = await loadComponentDescriptor(contentWithController('cd-err'));
        expect(first.isErr()).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(1);

        mockFetch.mockResolvedValueOnce(jsonResponse({ key: 'cd-err' }));

        const second = await loadComponentDescriptor(contentWithController('cd-err'));
        expect(second.isOk()).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry within the same call when the shared cached request fails', async () => {
        let resolveFirst: (value: Response) => void;
        mockFetch.mockImplementationOnce(() => new Promise<Response>((resolve) => (resolveFirst = resolve)));
        mockFetch.mockResolvedValueOnce(jsonResponse({ key: 'cd-retry' }));

        // Second caller arrives while the first fetch is still pending, so it
        // receives the shared cached request.
        const first = loadComponentDescriptor(contentWithController('cd-retry'));
        const second = loadComponentDescriptor(contentWithController('cd-retry'));

        resolveFirst(errorResponse(500, 'Server Error'));

        const [firstResult, secondResult] = await Promise.all([first, second]);

        expect(firstResult.isErr()).toBe(true);
        expect(secondResult.isOk()).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });
});

describe('loadNearestSite', () => {
    it('should POST the content id and parse the site', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'site-1' }));

        const result = await loadNearestSite(contentId('child-1'));

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ parsedId: 'site-1' });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('content/content/nearestSite');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contentId: 'child-1' }),
        });
    });

    it('should resolve with undefined when there is no nearest site (HTTP 204)', async () => {
        mockFetch.mockResolvedValue(errorResponse(204));

        const result = await loadNearestSite(contentId('orphan'));

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
        expect(mockParseContent).not.toHaveBeenCalled();
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await loadNearestSite(contentId('child-1'));

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('loadDefaultPageTemplate', () => {
    it('should GET the default template endpoint with site and content-type params', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'tpl-def' }));

        const result = await loadDefaultPageTemplate(contentId('site-1'), contentTypeName('mytype'));

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ parsedId: 'tpl-def' });

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('content/content/page/template/default');
        expect(url).toContain('siteId=site-1');
        expect(url).toContain('contentTypeName=mytype');
    });

    it('should resolve with undefined when the body is empty (HTTP 204)', async () => {
        mockFetch.mockResolvedValue(errorResponse(204));

        const result = await loadDefaultPageTemplate(contentId('site-1'), contentTypeName('mytype'));

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
        expect(mockParseContent).not.toHaveBeenCalled();
    });
});
