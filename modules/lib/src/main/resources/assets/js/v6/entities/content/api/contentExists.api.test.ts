import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import { AppError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { contentExistsByPath } from './contentExists.api';

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
});

describe('contentExistsByPath', () => {
    it('should POST the path to the contentsExistByPath endpoint and resolve the matching entry', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contentsExistJson: [{ contentPath: '/site/page', exists: true }] }));

        const result = await contentExistsByPath('/site/page');

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/contentsExistByPath');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contentPaths: ['/site/page'] }),
        });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBe(true);
    });

    it('should resolve false when the entry reports the path as absent', async () => {
        mockFetch.mockResolvedValue(
            jsonResponse({ contentsExistJson: [{ contentPath: '/site/page', exists: false }] }),
        );

        const result = await contentExistsByPath('/site/page');

        expect(result._unsafeUnwrap()).toBe(false);
    });

    it('should resolve false when the response has no entry for the sent path', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contentsExistJson: [] }));

        const result = await contentExistsByPath('/site/page');

        expect(result._unsafeUnwrap()).toBe(false);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await contentExistsByPath('/site/page');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
