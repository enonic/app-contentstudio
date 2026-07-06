import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { ContentId } from '../../../../app/content/ContentId';
import { Branch } from '../../../../app/versioning/Branch';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { resolveDependencies } from './dependencies.api';

vi.mock('../../../../app/resource/ResolveDependenciesResult', () => ({
    ResolveDependenciesResult: { fromJson: (json: unknown) => ({ resultFrom: json }) },
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

describe('resolveDependencies', () => {
    it('should POST the content ids with the draft target by default and parse the result', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ dependencies: [] }));

        const result = await resolveDependencies([new ContentId('a'), new ContentId('b')]);

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/getDependencies');
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body)).toEqual({ contentIds: ['a', 'b'], target: 'draft' });

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toMatchObject({ resultFrom: { dependencies: [] } });
    });

    it('should send the master target when given', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ dependencies: [] }));

        await resolveDependencies([new ContentId('a')], Branch.MASTER);

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.target).toBe('master');
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await resolveDependencies([new ContentId('a')]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
