import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import { Styles } from '../../../../app/inputtype/ui/text/styles/Styles';
import { AppError } from '../../../shared/api/errors';
import { $config } from '../../../shared/config/config.store';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { fetchStyles } from './styles.api';

// ! Styles.INSTANCES is a permanent page-lifetime singleton with no reset API,
// so every test uses a unique contentId to stay independent.

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
    $config.setKey('services', { ...$config.get().services, stylesUrl: '/admin/site/service/styles' });
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
});

const stylesResponse = (css: string[] = [], styles: object[] = []): Response => jsonResponse({ css, styles });

describe('fetchStyles', () => {
    it('should GET the styles service url with the contentId and active project', async () => {
        mockFetch.mockImplementation(() => Promise.resolve(stylesResponse()));

        const result = await fetchStyles('styles-url-1');

        expect(result.isOk()).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url] = mockFetch.mock.calls[0];
        expect(url).toBe('/admin/site/service/styles?contentId=styles-url-1&project=test-project');
    });

    it('should send an explicit project name when given', async () => {
        mockFetch.mockImplementation(() => Promise.resolve(stylesResponse()));

        await fetchStyles('styles-url-2', 'other-project');

        const [url] = mockFetch.mock.calls[0];
        expect(url).toBe('/admin/site/service/styles?contentId=styles-url-2&project=other-project');
    });

    it('should parse the response and register the styles singleton for the content', async () => {
        mockFetch.mockImplementation(() =>
            Promise.resolve(stylesResponse(['a.css', 'b.css'], [{ element: 'image', name: 's1', label: 'Style 1' }])),
        );

        const result = await fetchStyles('styles-reg-1');

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeInstanceOf(Styles);
        expect(Styles.getCssPaths('styles-reg-1')).toEqual(['a.css', 'b.css']);
    });

    it('should short-circuit to the registered instance on repeat calls', async () => {
        mockFetch.mockImplementation(() => Promise.resolve(stylesResponse(['c.css'])));

        const first = await fetchStyles('styles-cache-1');
        mockFetch.mockClear();
        const second = await fetchStyles('styles-cache-1');

        expect(mockFetch).not.toHaveBeenCalled();
        expect(second.isOk()).toBe(true);
        expect(second._unsafeUnwrap()).toBe(first._unsafeUnwrap());
    });

    it('should dedupe concurrent requests for the same content', async () => {
        mockFetch.mockImplementation(() => Promise.resolve(stylesResponse(['d.css'])));

        const [first, second] = await Promise.all([fetchStyles('styles-flight-1'), fetchStyles('styles-flight-1')]);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(first.isOk()).toBe(true);
        expect(second.isOk()).toBe(true);
    });

    it('should surface an AppError on failure and retry on the next call', async () => {
        mockFetch.mockImplementation(() => Promise.resolve(errorResponse(500, 'Server Error')));

        const failed = await fetchStyles('styles-err-1');

        expect(failed.isErr()).toBe(true);
        expect(failed._unsafeUnwrapErr()).toBeInstanceOf(AppError);

        mockFetch.mockImplementation(() => Promise.resolve(stylesResponse(['e.css'])));

        const retried = await fetchStyles('styles-err-1');

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(retried.isOk()).toBe(true);
        expect(Styles.getCssPaths('styles-err-1')).toEqual(['e.css']);
    });
});
