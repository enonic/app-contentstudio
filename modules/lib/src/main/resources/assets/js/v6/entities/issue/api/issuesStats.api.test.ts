import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import { IssueType } from '../../../../app/issue/IssueType';
import { AppError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { fetchIssueStats } from './issuesStats.api';

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
});

describe('fetchIssueStats', () => {
    it('should POST a null type to the project-scoped stats endpoint and return the raw stats', async () => {
        const stats = { open: 3, openCreatedByMe: 1, openAssignedToMe: 2, closed: 5 };
        mockFetch.mockResolvedValue(jsonResponse(stats));

        const result = await fetchIssueStats('my-project');

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/my-project/issue/stats');
        expect(url).not.toContain('/content/');
        expect(init).toMatchObject({ method: 'POST', body: JSON.stringify({ type: null }) });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toMatchObject(stats);
    });

    it('should fall back to the active project when no project name is given', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ open: 0 }));

        await fetchIssueStats();

        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/issue/stats');
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchIssueStats('my-project');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });

    it('should serialize the STANDARD type name even though its numeric value is zero', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ open: 0 }));

        await fetchIssueStats('my-project', IssueType.STANDARD);

        const [, init] = mockFetch.mock.calls[0];
        expect(init.body).toBe(JSON.stringify({ type: 'STANDARD' }));
    });

    it('should serialize the PUBLISH_REQUEST type name', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ open: 0 }));

        await fetchIssueStats('my-project', IssueType.PUBLISH_REQUEST);

        const [, init] = mockFetch.mock.calls[0];
        expect(init.body).toBe(JSON.stringify({ type: 'PUBLISH_REQUEST' }));
    });
});
