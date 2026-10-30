import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import { $config } from '../../../shared/config/config.store';
import { errorResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { fetchContextWidgetHtml } from './contextWidget.api';

const WIDGET_URL = '/admin/rest-v2/cs/extensions/com.app/layers';

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
    $config.setKey('branch', 'draft');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
    $config.setKey('branch', '');
});

describe('fetchContextWidgetHtml', () => {
    it('should GET the widget url with content, repository and branch params', async () => {
        mockFetch.mockResolvedValue(new Response('<p>widget</p>', { status: 200 }));

        const result = await fetchContextWidgetHtml({ url: WIDGET_URL, contentId: 'content-1' });

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBe('<p>widget</p>');

        const [url, init] = mockFetch.mock.calls[0];
        const parsed = new URL(url, 'http://localhost');
        expect(parsed.pathname).toBe(WIDGET_URL);
        expect(parsed.searchParams.get('contentId')).toBe('content-1');
        expect(parsed.searchParams.get('repository')).toBe('com.enonic.cms.test-project');
        expect(parsed.searchParams.get('branch')).toBe('draft');
        expect(parsed.searchParams.get('t')).toMatch(/^\d+$/);
        expect(init).toMatchObject({ credentials: 'include' });
    });

    it('should omit the content id and branch when absent', async () => {
        $config.setKey('branch', '');
        mockFetch.mockResolvedValue(new Response('', { status: 200 }));

        await fetchContextWidgetHtml({ url: WIDGET_URL, projectName: 'other' });

        const parsed = new URL(mockFetch.mock.calls[0][0], 'http://localhost');
        expect(parsed.searchParams.has('contentId')).toBe(false);
        expect(parsed.searchParams.has('branch')).toBe(false);
        expect(parsed.searchParams.get('repository')).toBe('com.enonic.cms.other');
    });

    it('should err on a non-ok status', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchContextWidgetHtml({ url: WIDGET_URL });

        expect(result.isErr()).toBe(true);
    });
});
