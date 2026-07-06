import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import type { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import type { PropertyArrayJson } from '@enonic/lib-admin-ui/data/PropertyArrayJson';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { fetchMacros, fetchMacroPreview, fetchMacroPreviewString } from './macro.api';

const { mockFromJson } = vi.hoisted(() => ({
    mockFromJson: vi.fn((json: { key: string }) => ({ key: json.key })),
}));

vi.mock('@enonic/lib-admin-ui/macro/MacroDescriptor', () => ({
    MacroDescriptor: { fromJson: mockFromJson },
}));

const appKey = (key: string): ApplicationKey => ({ toString: () => key }) as ApplicationKey;
const formData: PropertyArrayJson[] = [];

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
});

afterEach(() => {
    restoreFetch();
    mockFromJson.mockClear();
});

describe('fetchMacros', () => {
    it('should POST app keys to the macro getByApps endpoint and parse the descriptors', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ macros: [{ key: 'm-1' }, { key: 'm-2' }] }));

        const result = await fetchMacros([appKey('app:a')]);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toHaveLength(2);
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/macro/getByApps');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ appKeys: ['app:a'] }),
        });
    });

    it('should scope the URL to an explicit project when provided', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ macros: [] }));

        await fetchMacros([appKey('app:a')], 'other-project');

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('cms/other-project/macro/getByApps');
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchMacros([appKey('app:a')]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('fetchMacroPreview', () => {
    it('should POST the form and map the preview response', async () => {
        mockFetch.mockResolvedValue(
            jsonResponse({ html: '<p>x</p>', macro: '[macro/]', pageContributions: { foo: 'bar' } }),
        );

        const result = await fetchMacroPreview(formData, 'macro-key', '/site/page');

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({
            html: '<p>x</p>',
            macroString: '[macro/]',
            pageContributions: { foo: 'bar' },
        });
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/macro/preview');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ form: formData, macroKey: 'macro-key', contentPath: '/site/page' }),
        });
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchMacroPreview(formData, 'macro-key', '/site/page');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('fetchMacroPreviewString', () => {
    it('should POST the form and return the macro string', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ macro: '[macro/]' }));

        const result = await fetchMacroPreviewString(formData, 'macro-key');

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBe('[macro/]');
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/macro/previewString');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ form: formData, macroKey: 'macro-key' }),
        });
    });
});
