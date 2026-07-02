import type { TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { useStore } from '@nanostores/preact';
import { useEffect, useRef } from 'react';
import {
    cleanupTask as cleanupTaskService,
    getTaskPhaseInfo,
    trackTask as trackTaskService,
    $taskStore,
} from '../../entities/task';
import type { TaskPhase, TaskTrackerConfig, TaskProgressState, TaskResultState } from '../../entities/task';
import { clampProgress } from '../../shared/lib/cms/content/progress';

export type UseTaskProgressResult = {
    /** Current progress value (0-100), clamped */
    progress: number;
    /** Current task state */
    state: TaskProgressState;
    /** True when task completed successfully */
    isComplete: boolean;
    /** True when task failed */
    isError: boolean;
    /** Result message from task completion */
    resultMessage?: string;
    /** Result state (SUCCESS, ERROR, WARNING) */
    resultState?: TaskResultState;
    /** Current phase reported by a multi-phase task while running */
    phase?: TaskPhase;
    /** Number of items covered by the current phase */
    phaseTotal?: number;
};

/**
 * Hook to track task progress in React components.
 * Automatically starts tracking when taskId is provided and stops on cleanup.
 *
 * @param taskId - The task ID to track, or null/undefined to not track
 * @param config - Optional configuration for callbacks
 * @returns Task progress state
 *
 * @example
 * const {progress, isComplete, isError} = useTaskProgress(taskId, {
 *     onComplete: (state, message) => {
 *         if (state === 'SUCCESS') {
 *             showSuccess(message);
 *         }
 *     },
 * });
 */
export const useTaskProgress = (
    taskId: TaskId | null | undefined,
    config?: TaskTrackerConfig,
): UseTaskProgressResult => {
    const store = useStore($taskStore);
    const configRef = useRef(config);

    // Keep config ref updated
    configRef.current = config;

    useEffect(() => {
        if (!taskId) {
            return;
        }

        const cleanup = trackTaskService(taskId, configRef.current);
        return cleanup;
    }, [taskId?.toString()]);

    if (!taskId) {
        return {
            progress: 0,
            state: 'idle',
            isComplete: false,
            isError: false,
        };
    }

    const taskIdStr = taskId.toString();
    const taskState = store.tasks.get(taskIdStr);

    if (!taskState) {
        return {
            progress: 0,
            state: 'idle',
            isComplete: false,
            isError: false,
        };
    }

    const phaseInfo = getTaskPhaseInfo(taskState.taskInfo);

    return {
        progress: clampProgress(taskState.progress),
        state: taskState.state,
        isComplete: taskState.state === 'finished',
        isError: taskState.state === 'failed',
        resultMessage: taskState.resultMessage,
        resultState: taskState.resultState,
        phase: phaseInfo?.phase,
        phaseTotal: phaseInfo?.count,
    };
};

/**
 * Imperatively track a task without a React component.
 * Returns a cleanup function to stop tracking.
 *
 * @param taskId - The task ID to track
 * @param config - Optional configuration for callbacks
 * @returns Cleanup function
 *
 * @example
 * const stopTracking = trackTask(taskId, {
 *     onProgress: (progress) => updateUI(progress),
 *     onComplete: (state, message) => handleComplete(state, message),
 * });
 * // Later: stopTracking();
 */
export const trackTask = (taskId: TaskId, config?: TaskTrackerConfig): FnVoid => {
    return trackTaskService(taskId, config);
};

/**
 * Clean up task state from the store.
 * Call this after handling completion to remove stale state.
 *
 * @param taskId - The task ID to clean up
 */
export const cleanupTask = (taskId: TaskId): void => {
    cleanupTaskService(taskId);
};
