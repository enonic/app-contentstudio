import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { type TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { fetchTaskInfo } from './task.api';

vi.mock('@enonic/lib-admin-ui/task/TaskInfo', () => ({
    TaskInfo: {
        fromJson: (json: unknown) => ({ taskFrom: json }),
    },
}));

const taskId = (id: string): TaskId => ({ toString: () => id }) as TaskId;

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
});

afterEach(() => {
    restoreFetch();
});

describe('fetchTaskInfo', () => {
    it('should GET the task endpoint with the encoded task id and parse the task info', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 't/1', state: 'RUNNING' }));

        const result = await fetchTaskInfo(taskId('t/1'));

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/tasks/t%2F1');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ taskFrom: { id: 't/1', state: 'RUNNING' } });
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(404, 'Not Found'));

        const result = await fetchTaskInfo(taskId('t-404'));

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
