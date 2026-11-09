import type { TaskInfo } from '@enonic/ui-types';
import type { AppError } from '@enonic/ui-utils';
import { pollTask, TaskFailedError, taskProgressPercent } from '@enonic/ui-utils/task';
import { MessageType } from '../../../app/stores/data/server';
import type { ReceivedWorkerMessage } from '../../../app/stores/data/worker';
import { subscribe as subscribeToWorker } from '../../../app/stores/worker';
import { getCmsRestUri } from '../../shared/lib/url/cms';
import { completeTask, registerTask, unregisterTask, updateTaskProgress, type TaskResultState } from './task.store';

//
// * Types
//

type ProgressInfoJson = {
    state: TaskResultState;
    message: string;
};

export type TaskPhase = 'unpublish' | 'archive' | 'publish' | 'restore' | 'delete';

export type TaskPhaseInfo = {
    phase: TaskPhase;
    count?: number;
};

export type TaskTrackerConfig = {
    /** Callback when task completes (success, error, or warning) */
    onComplete?: (state: TaskResultState, message: string) => void;
    /** Callback when progress updates */
    onProgress?: (progress: number) => void;
};

type ActiveTracker = {
    poll: AbortController;
    unsubscribe: () => void;
};

//
// * State
//

const activeTrackers = new Map<string, ActiveTracker>();

//
// * Private
//

const parseProgressInfo = (taskInfo: TaskInfo): ProgressInfoJson => {
    try {
        return JSON.parse(taskInfo.progress.info) as ProgressInfoJson;
    } catch {
        return {
            state: 'SUCCESS',
            message: taskInfo.progress.info,
        };
    }
};

const readTaskEvent = (message: ReceivedWorkerMessage, taskId: string): TaskInfo | undefined => {
    if (message.payload.type !== MessageType.TASK) {
        return undefined;
    }

    const { type, data } = message.payload.payload;
    if (type === 'task.removed') {
        return undefined;
    }

    const taskInfo = data as TaskInfo | undefined;
    return taskInfo?.id === taskId ? taskInfo : undefined;
};

const finishTracking = (
    taskId: string,
    taskInfo: TaskInfo | undefined,
    state: TaskResultState,
    message: string,
    config: TaskTrackerConfig,
): void => {
    stopTracking(taskId);
    completeTask(taskId, taskInfo, state, message);
    config.onComplete?.(state, message);
};

const handleProgress = (taskId: string, taskInfo: TaskInfo, config: TaskTrackerConfig): void => {
    updateTaskProgress(taskId, taskInfo, taskInfo.state === 'RUNNING' ? 'running' : 'pending');
    config.onProgress?.(taskProgressPercent(taskInfo));
};

const handleFinished = (taskId: string, taskInfo: TaskInfo, config: TaskTrackerConfig): void => {
    const { state, message } = parseProgressInfo(taskInfo);
    finishTracking(taskId, taskInfo, state, message, config);
};

const handleFailed = (taskId: string, taskInfo: TaskInfo, config: TaskTrackerConfig): void => {
    finishTracking(taskId, taskInfo, 'ERROR', parseProgressInfo(taskInfo).message, config);
};

const handleTaskInfo = (taskId: string, taskInfo: TaskInfo, config: TaskTrackerConfig): void => {
    if (taskInfo.state === 'FINISHED') {
        handleFinished(taskId, taskInfo, config);
    } else if (taskInfo.state === 'FAILED') {
        handleFailed(taskId, taskInfo, config);
    } else {
        handleProgress(taskId, taskInfo, config);
    }
};

const handleError = (taskId: string, error: AppError, config: TaskTrackerConfig): void => {
    if (error instanceof TaskFailedError) {
        handleFailed(taskId, error.task, config);
        return;
    }

    finishTracking(taskId, undefined, 'ERROR', error.message, config);
};

//
// * Public API
//

/**
 * Parse the phase marker from a running task's progress info.
 * Multi-phase tasks report the current phase and the number of items it covers
 * as JSON: {"phase":"unpublish","count":123}.
 */
export const getTaskPhaseInfo = (taskInfo: TaskInfo | undefined): TaskPhaseInfo | undefined => {
    const info = taskInfo?.progress.info;
    if (!info) {
        return undefined;
    }

    try {
        const { phase, count } = JSON.parse(info) as { phase?: TaskPhase; count?: number };
        return phase ? { phase, count } : undefined;
    } catch {
        return undefined;
    }
};

/**
 * Start tracking a task's progress.
 * Follows the task events from the server socket, and polls the task until the first event
 * arrives, for a task that ends before the subscription or a socket that is down.
 *
 * @param taskId - The task ID to track
 * @param config - Optional configuration for callbacks
 * @returns Cleanup function to stop tracking
 */
export const trackTask = (taskId: string, config: TaskTrackerConfig = {}): (() => void) => {
    if (activeTrackers.has(taskId)) {
        return () => stopTracking(taskId);
    }

    registerTask(taskId);

    const poll = new AbortController();
    const tracker: ActiveTracker = { poll, unsubscribe: () => undefined };
    const isActive = (): boolean => activeTrackers.get(taskId) === tracker;
    const isPolling = (): boolean => isActive() && !poll.signal.aborted;

    activeTrackers.set(taskId, tracker);

    tracker.unsubscribe = subscribeToWorker((message) => {
        const taskInfo = readTaskEvent(message, taskId);
        if (taskInfo == null || !isActive()) {
            return;
        }

        poll.abort();
        handleTaskInfo(taskId, taskInfo, config);
    });

    void pollTask(getCmsRestUri('tasks'), taskId, {
        signal: poll.signal,
        onProgress: (taskInfo) => {
            if (isPolling()) {
                handleProgress(taskId, taskInfo, config);
            }
        },
    }).match(
        (taskInfo) => {
            if (isPolling()) {
                handleFinished(taskId, taskInfo, config);
            }
        },
        (error) => {
            if (isPolling()) {
                handleError(taskId, error, config);
            }
        },
    );

    return () => stopTracking(taskId);
};

/**
 * Stop tracking a task and clean up resources.
 * Does not remove the task state from the store.
 */
export const stopTracking = (taskId: string): void => {
    const tracker = activeTrackers.get(taskId);
    if (!tracker) {
        return;
    }

    activeTrackers.delete(taskId);
    tracker.poll.abort();
    tracker.unsubscribe();
};

/**
 * Clean up a task from the store after completion.
 * Call this after handling completion to remove stale state.
 */
export const cleanupTask = (taskId: string): void => {
    stopTracking(taskId);
    unregisterTask(taskId);
};

/**
 * Check if a task is currently being tracked.
 */
export const isTracking = (taskId: string): boolean => {
    return activeTrackers.has(taskId);
};
