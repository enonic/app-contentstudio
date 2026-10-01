import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import { restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { probePreview } from './preview.api';

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
});

afterEach(() => restoreFetch());

describe('probePreview', () => {
    it('should HEAD the extension URL and answer with the raw response', async () => {
        mockFetch.mockResolvedValue(new Response(null, { status: 418 }));

        const result = await probePreview('/admin/extension/preview-media?contentId=1&auto=true');

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().status).toBe(418);
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toBe('/admin/extension/preview-media?contentId=1&auto=true');
        expect(init).toMatchObject({ method: 'HEAD' });
    });
});
