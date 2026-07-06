import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import { PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { type ContentId } from '../../../../app/content/ContentId';
import { AppError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { updateContentLanguage, updateContentMetadata } from './properties.api';

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

describe('updateContentMetadata', () => {
    it('should POST the content id and owner to the updateMetadata endpoint', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'c-1' }));

        const result = await updateContentMetadata(contentId('c-1'), PrincipalKey.fromString('user:system:su'));

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/updateMetadata');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contentId: 'c-1', owner: 'user:system:su' }),
        });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('should omit the owner from the payload when clearing it', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'c-1' }));

        await updateContentMetadata(contentId('c-1'));

        const [, init] = mockFetch.mock.calls[0];
        expect(init.body).toBe(JSON.stringify({ contentId: 'c-1' }));
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await updateContentMetadata(contentId('c-1'));

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('updateContentLanguage', () => {
    it('should POST the content id and language to the updateLanguage endpoint', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'c-1' }));

        const result = await updateContentLanguage(contentId('c-1'), 'no');

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/updateLanguage');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contentId: 'c-1', language: 'no' }),
        });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('should omit the language from the payload when clearing it', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'c-1' }));

        await updateContentLanguage(contentId('c-1'));

        const [, init] = mockFetch.mock.calls[0];
        expect(init.body).toBe(JSON.stringify({ contentId: 'c-1' }));
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await updateContentLanguage(contentId('c-1'), 'no');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
