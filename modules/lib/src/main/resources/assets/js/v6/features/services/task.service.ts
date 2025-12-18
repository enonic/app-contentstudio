import {TaskEvent, TaskEventType} from '@enonic/lib-admin-ui/task/TaskEvent';
import type {TaskInfo} from '@enonic/lib-admin-ui/task/TaskInfo';
import type {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import type {TaskProgress} from '@enonic/lib-admin-ui/task/TaskProgress';
import {GetTaskInfoRequest} from '../../../app/resource/GetTaskInfoRequest';
import {
    registerTask,
    updateTaskProgress,
    completeTask,
    unregisterTask,
    type TaskResultState,
} from '../store/task.store';

//
// * Types
//

type ProgressInfoJson = {
    state: TaskResultState;
    message: string;
};

export type TaskTrackerConfig = {
    /** Callback when task completes (success, error, or warning) */
    onComplete?: (state: TaskResultState, message: string) => void;
    /** Callback when progress updates */
    onProgress?: (progress: number) => void;
};

type ActiveTracker = {
    taskId: TaskId;
    handler: (event: TaskEvent) => void;
    config: TaskTrackerConfig;
};

//
// * State
//

const activeTrackers = new Map<string, ActiveTracker>();

//
// * Private
//

const parseProgressInfo = (taskProgress: TaskProgress): ProgressInfoJson => {
    try {
        return JSON.parse(taskProgress.getInfo()) as ProgressInfoJson;
    } catch {
        return {
            state: 'SUCCESS',
            message: taskProgress.getInfo(),
        };
    }
};

const handleTaskFinished = (taskIdStr: string, taskInfo: TaskInfo, config: TaskTrackerConfig): void => {
    const progressJson = parseProgressInfo(taskInfo.getProgress());

    completeTask(taskIdStr, taskInfo, progressJson.state, progressJson.message);

    const tracker = activeTrackers.get(taskIdStr);
    if (tracker) {
        TaskEvent.un(tracker.handler);
        activeTrackers.delete(taskIdStr);
    }

    config.onComplete?.(progressJson.state, progressJson.message);
};

const handleTaskFailed = (taskIdStr: string, taskInfo: TaskInfo, config: TaskTrackerConfig): void => {
    const progressJson = parseProgressInfo(taskInfo.getProgress());

    completeTask(taskIdStr, taskInfo, 'ERROR', progressJson.message);

    const tracker = activeTrackers.get(taskIdStr);
    if (tracker) {
        TaskEvent.un(tracker.handler);
        activeTrackers.delete(taskIdStr);
    }

    config.onComplete?.('ERROR', progressJson.message);
};

const handleTaskInfo = (taskIdStr: string, taskInfo: TaskInfo, config: TaskTrackerConfig): void => {
    const tracker = activeTrackers.get(taskIdStr);
    if (!tracker) {
        return;
    }

    const taskState = taskInfo.getState();

    if (taskState === TaskState.FINISHED) {
        handleTaskFinished(taskIdStr, taskInfo, config);
        return;
    }

    if (taskState === TaskState.FAILED) {
        handleTaskFailed(taskIdStr, taskInfo, config);
        return;
    }

    const progressState = taskState === TaskState.RUNNING ? 'running' : 'pending';
    updateTaskProgress(taskIdStr, taskInfo, progressState);
    config.onProgress?.(taskInfo.getProgressPercentage());
};

//
// * Public API
//

/**
 * Start tracking a task's progress.
 * Subscribes to TaskEvents and handles race conditions via HTTP fallback.
 *
 * @param taskId - The task ID to track
 * @param config - Optional configuration for callbacks
 * @returns Cleanup function to stop tracking
 */
export const trackTask = (taskId: TaskId, config: TaskTrackerConfig = {}): (() => void) => {
    const taskIdStr = taskId.toString();

    if (activeTrackers.has(taskIdStr)) {
        return () => stopTracking(taskId);
    }

    registerTask(taskIdStr);

    let hasReceivedEvents = false;

    const handler = (event: TaskEvent): void => {
        if (!event.getTaskInfo().getId().equals(taskId)) {
            return;
        }

        if (event.getEventType() === TaskEventType.REMOVED) {
            return;
        }

        hasReceivedEvents = true;
        console.log(`Handle task info (event): ${taskIdStr}`);
        handleTaskInfo(taskIdStr, event.getTaskInfo(), config);
    };

    TaskEvent.on(handler);

    activeTrackers.set(taskIdStr, {
        taskId,
        handler,
        config,
    });

    // HTTP fallback for race conditions
    new GetTaskInfoRequest(taskId).sendAndParse()
        .then((taskInfo: TaskInfo) => {
            if (!hasReceivedEvents) {
                handleTaskInfo(taskIdStr, taskInfo, config);
                console.log(`Handle task info (HTTP fallback): ${taskIdStr}`);
            }
        })
        .catch(() => {
            // Ignore errors - this is just a fallback
        });

    return () => stopTracking(taskId);
};

/**
 * Stop tracking a task and clean up resources.
 * Does not remove the task state from the store.
 */
export const stopTracking = (taskId: TaskId): void => {
    const taskIdStr = taskId.toString();
    const tracker = activeTrackers.get(taskIdStr);

    if (!tracker) {
        return;
    }

    TaskEvent.un(tracker.handler);
    activeTrackers.delete(taskIdStr);
};

/**
 * Clean up a task from the store after completion.
 * Call this after handling completion to remove stale state.
 */
export const cleanupTask = (taskId: TaskId): void => {
    const taskIdStr = taskId.toString();
    stopTracking(taskId);
    unregisterTask(taskIdStr);
};

/**
 * Check if a task is currently being tracked.
 */
export const isTracking = (taskId: TaskId): boolean => {
    return activeTrackers.has(taskId.toString());
};
