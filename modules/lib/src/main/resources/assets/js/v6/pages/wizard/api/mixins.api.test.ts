import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { type ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { type ContentId } from '../../../../app/content/ContentId';
import { AppError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { fetchApplicationMixins, fetchContentMixins } from './mixins.api';

vi.mock('../../../../app/content/MixinDescriptor', () => ({
    MixinDescriptor: {
        fromJson: (json: unknown) => ({ mixinFrom: json }),
    },
}));

const contentTypeName = (name: string): ContentTypeName => ({ toString: () => name }) as ContentTypeName;
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

describe('fetchApplicationMixins', () => {
    it('should GET the application mixins endpoint with content type and application key', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ mixins: [{ name: 'm-1' }] }));

        const result = await fetchApplicationMixins(contentTypeName('my:type'), ApplicationKey.fromString('com.app'));

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain(
            '/rest-v2/cs/cms/test-project/content/schema/mixins/getApplicationMixinsForContentType?contentTypeName=my%3Atype&applicationKey=com.app',
        );
        expect(url).not.toContain('/content/content/');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([{ mixinFrom: { name: 'm-1' } }]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchApplicationMixins(contentTypeName('my:type'), ApplicationKey.fromString('com.app'));

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('fetchContentMixins', () => {
    it('should GET the content mixins endpoint with the content id', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ mixins: [{ name: 'm-2' }] }));

        const result = await fetchContentMixins(contentId('c-1'));

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/schema/mixins/getContentMixins?contentId=c-1');
        expect(url).not.toContain('/content/content/');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([{ mixinFrom: { name: 'm-2' } }]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchContentMixins(contentId('c-1'));

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
