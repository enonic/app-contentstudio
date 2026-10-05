import { type Extension } from '@enonic/lib-admin-ui/extension/Extension';
import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import { restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { clearPreview, requestPreview, whenPreviewSettled } from './previewResolution.store';

const media = { name: 'media' } as unknown as Extension;

const request = { auto: false, showFrame: true, candidates: [{ extension: media, url: '/media' }] };

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
});

afterEach(() => {
    clearPreview();
    restoreFetch();
});

describe('previewResolution.store', () => {
    describe('resolution', () => {
        it('should resolve a request without the app starting anything', async () => {
            mockFetch.mockResolvedValue(new Response(null, { status: 200 }));

            requestPreview(request);

            expect(await whenPreviewSettled()).toMatchObject({ kind: 'ready', extension: media });
        });

        it('should start resolving before anyone listens', () => {
            mockFetch.mockImplementation(() => new Promise<Response>(() => undefined));

            requestPreview(request);

            expect(mockFetch).toHaveBeenCalledTimes(1);
        });
    });
});
