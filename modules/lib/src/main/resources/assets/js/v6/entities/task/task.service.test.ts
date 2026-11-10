import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { TaskInfo, TaskState } from '@enonic/ui-types';
import { MessageType } from '../../../app/stores/data/server';
import type { ReceivedWorkerMessage } from '../../../app/stores/data/worker';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../shared/lib/test/fetch.test.utils';

const worker = vi.hoisted(() => ({ listeners: new Set<(message: ReceivedWorkerMessage) => void>() }));

vi.mock('../../../app/stores/worker', () => ({
    subscribe: (listener: (message: ReceivedWorkerMessage) => void) => {
        worker.listeners.add(listener);
        return () => worker.listeners.delete(listener);
    },
}));

import { cleanupTask, getTaskPhaseInfo, isTracking, trackTask } from './task.service';
import { getTaskState } from './task.store';

const task = (state: TaskState, info = '', current = 0, total = 0): TaskInfo => ({
    id: 'task-1',
    description: 'Task',
    state,
    progress: { info, current, total },
});

const emit = (type: string, data: TaskInfo): void => {
    const message = {
        type: 'received',
        payload: { type: MessageType.TASK, payload: { type, timestamp: 0, data } },
    } as ReceivedWorkerMessage;
    worker.listeners.forEach((listener) => listener(message));
};

let mockFetch: Mock;

beforeEach(() => {
    vi.useFakeTimers();
    mockFetch = stubFetch();
});

afterEach(() => {
    cleanupTask('task-1');
    restoreFetch();
    vi.useRealTimers();
});

describe('trackTask', () => {
    it('should poll the task resource and report progress until the task finishes', async () => {
        mockFetch
            .mockResolvedValueOnce(jsonResponse(task('RUNNING', '', 3, 4)))
            .mockResolvedValueOnce(jsonResponse(task('FINISHED', '{"state":"SUCCESS","message":"Done"}', 4, 4)));
        const onProgress = vi.fn();
        const onComplete = vi.fn();

        trackTask('task-1', { onProgress, onComplete });
        await vi.advanceTimersByTimeAsync(0);

        expect(mockFetch.mock.calls[0][0]).toContain('/rest-v2/cs/tasks/task-1');
        expect(onProgress).toHaveBeenCalledWith(75);
        expect(getTaskState('task-1')).toMatchObject({ state: 'running', progress: 75 });

        await vi.advanceTimersByTimeAsync(500);

        expect(onComplete).toHaveBeenCalledWith('SUCCESS', 'Done');
        expect(getTaskState('task-1')).toMatchObject({ state: 'finished', progress: 100, resultMessage: 'Done' });
        expect(isTracking('task-1')).toBe(false);
    });

    it('should report a waiting task as pending', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse(task('WAITING')));

        trackTask('task-1');
        await vi.advanceTimersByTimeAsync(0);

        expect(getTaskState('task-1')).toMatchObject({ state: 'pending', progress: 0 });
    });

    it('should read the result state Content Studio reports in a finished task', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse(task('FINISHED', '{"state":"WARNING","message":"Partly"}')));
        const onComplete = vi.fn();

        trackTask('task-1', { onComplete });
        await vi.advanceTimersByTimeAsync(0);

        expect(onComplete).toHaveBeenCalledWith('WARNING', 'Partly');
        expect(getTaskState('task-1')).toMatchObject({ state: 'failed', resultState: 'WARNING' });
    });

    it('should treat a finished task with plain text info as a success with that message', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse(task('FINISHED', 'Moved 3 items')));
        const onComplete = vi.fn();

        trackTask('task-1', { onComplete });
        await vi.advanceTimersByTimeAsync(0);

        expect(onComplete).toHaveBeenCalledWith('SUCCESS', 'Moved 3 items');
    });

    it('should complete a failed task as an error with its message', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse(task('FAILED', '{"state":"ERROR","message":"Boom"}', 1, 4)));
        const onComplete = vi.fn();

        trackTask('task-1', { onComplete });
        await vi.advanceTimersByTimeAsync(0);

        expect(onComplete).toHaveBeenCalledWith('ERROR', 'Boom');
        expect(getTaskState('task-1')).toMatchObject({ state: 'failed', resultState: 'ERROR', resultMessage: 'Boom' });
    });

    it('should retry a failed read instead of failing the task', async () => {
        mockFetch
            .mockResolvedValueOnce(errorResponse(503, 'Service Unavailable'))
            .mockRejectedValueOnce(new TypeError('Failed to fetch'))
            .mockResolvedValueOnce(jsonResponse(task('FINISHED', '{"state":"SUCCESS","message":"Done"}')));
        const onComplete = vi.fn();

        trackTask('task-1', { onComplete });
        await vi.advanceTimersByTimeAsync(0);

        expect(onComplete).not.toHaveBeenCalled();
        expect(getTaskState('task-1')).toMatchObject({ state: 'pending' });

        await vi.advanceTimersByTimeAsync(4000);

        expect(mockFetch).toHaveBeenCalledTimes(3);
        expect(onComplete).toHaveBeenCalledOnce();
        expect(onComplete).toHaveBeenCalledWith('SUCCESS', 'Done');
    });

    it.each([
        [401, 'Unauthorized'],
        [404, 'Not Found'],
    ])('should fail the task and stop polling on a %i read', async (status, statusText) => {
        mockFetch.mockResolvedValue(errorResponse(status, statusText));
        const onComplete = vi.fn();

        trackTask('task-1', { onComplete });
        await vi.advanceTimersByTimeAsync(4000);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(onComplete).toHaveBeenCalledOnce();
        expect(onComplete).toHaveBeenCalledWith('ERROR', expect.any(String));
        expect(getTaskState('task-1')).toMatchObject({ state: 'failed', resultState: 'ERROR' });
        expect(isTracking('task-1')).toBe(false);
        expect(worker.listeners.size).toBe(0);
    });

    it('should poll a task once when it is tracked twice', async () => {
        mockFetch.mockResolvedValue(jsonResponse(task('RUNNING', '', 1, 4)));

        trackTask('task-1');
        trackTask('task-1');
        await vi.advanceTimersByTimeAsync(0);

        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should stop polling and keep quiet once the task is cleaned up', async () => {
        mockFetch.mockResolvedValue(jsonResponse(task('RUNNING', '', 1, 4)));
        const onComplete = vi.fn();

        trackTask('task-1', { onComplete });
        await vi.advanceTimersByTimeAsync(0);
        cleanupTask('task-1');
        await vi.advanceTimersByTimeAsync(2000);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(onComplete).not.toHaveBeenCalled();
        expect(getTaskState('task-1')).toBeUndefined();
    });

    it('should keep the store state when only tracking stops', async () => {
        mockFetch.mockResolvedValue(jsonResponse(task('RUNNING', '', 1, 4)));

        const stop = trackTask('task-1');
        await vi.advanceTimersByTimeAsync(0);
        stop();
        await vi.advanceTimersByTimeAsync(2000);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(getTaskState('task-1')).toMatchObject({ state: 'running', progress: 25 });
    });
});

describe('trackTask with task events', () => {
    it('should follow the task events and stop polling once the first one arrives', async () => {
        mockFetch.mockResolvedValue(jsonResponse(task('WAITING')));
        const onProgress = vi.fn();
        const onComplete = vi.fn();

        trackTask('task-1', { onProgress, onComplete });
        await vi.advanceTimersByTimeAsync(0);
        emit('task.updated', task('RUNNING', '', 1, 2));

        expect(onProgress).toHaveBeenLastCalledWith(50);
        expect(getTaskState('task-1')).toMatchObject({ state: 'running', progress: 50 });

        await vi.advanceTimersByTimeAsync(2000);
        expect(mockFetch).toHaveBeenCalledTimes(1);

        emit('task.finished', task('FINISHED', '{"state":"SUCCESS","message":"Done"}', 2, 2));

        expect(onComplete).toHaveBeenCalledWith('SUCCESS', 'Done');
        expect(getTaskState('task-1')).toMatchObject({ state: 'finished', progress: 100 });
        expect(isTracking('task-1')).toBe(false);
        expect(worker.listeners.size).toBe(0);
    });

    it('should let an event win over a poll that is still in flight', async () => {
        let respond: (response: Response) => void = () => undefined;
        mockFetch.mockReturnValueOnce(new Promise<Response>((resolve) => (respond = resolve)));
        const onComplete = vi.fn();

        trackTask('task-1', { onComplete });
        emit('task.failed', task('FAILED', '{"state":"ERROR","message":"Boom"}'));
        respond(jsonResponse(task('RUNNING', '', 1, 4)));
        await vi.advanceTimersByTimeAsync(0);

        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onComplete).toHaveBeenCalledWith('ERROR', 'Boom');
        expect(getTaskState('task-1')).toMatchObject({ state: 'failed', resultMessage: 'Boom' });
    });

    it('should keep listening to the socket while reads fail', async () => {
        mockFetch.mockResolvedValue(errorResponse(503, 'Service Unavailable'));
        const onComplete = vi.fn();

        trackTask('task-1', { onComplete });
        await vi.advanceTimersByTimeAsync(0);
        emit('task.finished', task('FINISHED', '{"state":"SUCCESS","message":"Done"}'));
        await vi.advanceTimersByTimeAsync(4000);

        expect(onComplete).toHaveBeenCalledOnce();
        expect(onComplete).toHaveBeenCalledWith('SUCCESS', 'Done');
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should ignore events of other tasks and removed tasks', async () => {
        mockFetch.mockResolvedValue(jsonResponse(task('WAITING')));
        const onComplete = vi.fn();

        trackTask('task-1', { onComplete });
        await vi.advanceTimersByTimeAsync(0);
        emit('task.finished', { ...task('FINISHED'), id: 'task-2' });
        emit('task.removed', task('FINISHED'));

        expect(onComplete).not.toHaveBeenCalled();
        expect(getTaskState('task-1')).toMatchObject({ state: 'pending' });
    });

    it('should drop the socket listener when tracking stops', () => {
        mockFetch.mockResolvedValue(jsonResponse(task('WAITING')));

        const stop = trackTask('task-1');
        expect(worker.listeners.size).toBe(1);
        stop();

        expect(worker.listeners.size).toBe(0);
    });
});

describe('getTaskPhaseInfo', () => {
    it('should read the phase and count a multi-phase task reports', () => {
        expect(getTaskPhaseInfo(task('RUNNING', '{"phase":"unpublish","count":12}'))).toEqual({
            phase: 'unpublish',
            count: 12,
        });
    });

    it('should return undefined without a phase marker', () => {
        expect(getTaskPhaseInfo(task('RUNNING', 'Working'))).toBeUndefined();
        expect(getTaskPhaseInfo(task('RUNNING'))).toBeUndefined();
        expect(getTaskPhaseInfo(undefined)).toBeUndefined();
    });
});
