import { type ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { ContentId } from '../../../../app/content/ContentId';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { loadPageControllers, loadPageDescriptor, loadPageTemplatesByCanRender } from './pageInspection.api';

const { mockFromJson } = vi.hoisted(() => ({
    mockFromJson: vi.fn((json: { key: string }) => ({ key: json.key })),
}));

vi.mock('../../../../app/page/Descriptor', () => ({
    Descriptor: { fromJson: mockFromJson },
}));

vi.mock('../../../../app/content/PageTemplate', () => ({
    PageTemplateBuilder: class {
        json: { id: string } | undefined;
        fromContentJson(json: { id: string }) {
            this.json = json;
            return this;
        }
        build() {
            return { templateId: this.json?.id };
        }
    },
}));

const contentId = (id: string): ContentId => ({ toString: () => id }) as ContentId;
const contentTypeName = (name: string): ContentTypeName => ({ toString: () => name }) as ContentTypeName;

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
    mockFromJson.mockClear();
});

describe('loadPageTemplatesByCanRender', () => {
    it('should GET the listByCanRender endpoint with params and build templates', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contents: [{ id: 't-1' }, { id: 't-2' }] }));

        const result = await loadPageTemplatesByCanRender(contentId('site-1'), contentTypeName('mytype'));

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([{ templateId: 't-1' }, { templateId: 't-2' }]);

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('content/content/page/template/listByCanRender');
        expect(url).toContain('siteId=site-1');
        expect(url).toContain('contentTypeName=mytype');
    });

    it('should resolve with an empty array when the response has no contents', async () => {
        mockFetch.mockResolvedValue(jsonResponse({}));

        const result = await loadPageTemplatesByCanRender(contentId('site-1'), contentTypeName('mytype'));

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await loadPageTemplatesByCanRender(contentId('site-1'), contentTypeName('mytype'));

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('loadPageControllers', () => {
    it('should GET the project-scoped pages schema endpoint and parse descriptors', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ descriptors: [{ key: 'a' }, { key: 'b' }] }));

        const result = await loadPageControllers(contentId('c-1'));

        expect(result.isOk()).toBe(true);
        const descriptors = result._unsafeUnwrap() as unknown as { key: string }[];
        expect(descriptors.map((d) => d.key)).toEqual(['a', 'b']);

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('cms/test-project/content/schema/filter/pages');
        expect(url).toContain('contentId=c-1');
    });

    it('should resolve with an empty array when the response has no descriptors', async () => {
        mockFetch.mockResolvedValue(jsonResponse({}));

        const result = await loadPageControllers(contentId('c-1'));

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([]);
    });
});

describe('loadPageDescriptor', () => {
    it('should GET the page descriptor endpoint with the encoded key and parse it', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ key: 'app:ctrl' }));

        const result = await loadPageDescriptor('app:ctrl');

        expect(result.isOk()).toBe(true);
        expect((result._unsafeUnwrap() as unknown as { key: string }).key).toBe('app:ctrl');

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('content/page/descriptor');
        expect(url).toContain(`key=${encodeURIComponent('app:ctrl')}`);
    });

    it('should not fetch again on a cache hit', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ key: 'pd-hit' }));

        await loadPageDescriptor('pd-hit');
        expect(mockFetch).toHaveBeenCalledTimes(1);

        const second = await loadPageDescriptor('pd-hit');
        expect(second.isOk()).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not cache errors and refetch on the next call', async () => {
        mockFetch.mockResolvedValueOnce(errorResponse(500, 'Server Error'));

        const first = await loadPageDescriptor('pd-err');
        expect(first.isErr()).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(1);

        mockFetch.mockResolvedValueOnce(jsonResponse({ key: 'pd-err' }));

        const second = await loadPageDescriptor('pd-err');
        expect(second.isOk()).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });
});
