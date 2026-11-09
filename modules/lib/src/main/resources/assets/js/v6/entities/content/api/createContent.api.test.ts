import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { AppError } from '@enonic/ui-utils';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { createContent } from './createContent.api';

vi.mock('../../../../app/content/Content', () => ({
    ContentBuilder: class {
        json: unknown;
        fromContentJson(json: unknown) {
            this.json = json;
            return this;
        }
        build() {
            return { builtFrom: this.json };
        }
    },
}));

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
});

describe('createContent', () => {
    it('should POST an unnamed, empty content of the type to the root of the given project', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'c-1' }));

        const result = await createContent({ contentType: 'my:type', projectName: 'other' });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/other/content/content/create');
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body)).toEqual({
            valid: false,
            requireValid: false,
            name: '__unnamed__',
            parent: '/',
            contentType: 'my:type',
            data: [],
            meta: [],
            displayName: '',
            workflow: { state: 'IN_PROGRESS', checks: {} },
        });
        expect(result._unsafeUnwrap()).toEqual({ builtFrom: { id: 'c-1' } });
    });

    it('should fall back to the active project', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'c-1' }));

        await createContent({ contentType: 'my:type' });

        expect(mockFetch.mock.calls[0][0]).toContain('/rest-v2/cs/cms/test-project/content/content/create');
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(403, 'Forbidden'));

        const result = await createContent({ contentType: 'my:type' });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
