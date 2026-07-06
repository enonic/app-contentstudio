import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import { type ContentId } from '../../../../app/content/ContentId';
import { type ContentPath } from '../../../../app/content/ContentPath';
import { AppError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { moveContent } from './move.api';

const contentId = (id: string): ContentId => ({ toString: () => id }) as ContentId;
const contentPath = (path: string): ContentPath => ({ toString: () => path }) as ContentPath;

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
});

describe('moveContent', () => {
    it('should POST the content ids and parent path to the move endpoint and parse the task id', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ taskId: 't-move' }));

        const result = await moveContent([contentId('a'), contentId('b')], contentPath('/target'));

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/content/move');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contentIds: ['a', 'b'], parentContentPath: '/target' }),
        });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().toString()).toBe('t-move');
    });

    it('should send an empty parent path when no destination is given', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ taskId: 't-move' }));

        await moveContent([contentId('a')]);

        const [, init] = mockFetch.mock.calls[0];
        expect(init.body).toBe(JSON.stringify({ contentIds: ['a'], parentContentPath: '' }));
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await moveContent([contentId('a')], contentPath('/target'));

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
