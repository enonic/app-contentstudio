import {map} from 'nanostores';
import type {TaskInfo} from '@enonic/lib-admin-ui/task/TaskInfo';

//
// * Types
//

export type TaskProgressState = 'idle' | 'pending' | 'running' | 'finished' | 'failed';

export type TaskResultState = 'SUCCESS' | 'ERROR' | 'WARNING';

export type TaskTrackerState = {
    taskId: string;
    state: TaskProgressState;
    progress: number;           // 0-100
    startedAt: number;          // Timestamp when tracking started
    taskInfo?: TaskInfo;        // Latest TaskInfo from server
    resultMessage?: string;     // Success/error message from task completion
    resultState?: TaskResultState;
};

type TaskStoreState = {
    tasks: Map<string, TaskTrackerState>;
};

//
// * Store
//

const initialState: TaskStoreState = {
    tasks: new Map(),
};

export const $taskStore = map<TaskStoreState>(initialState);

//
// * Selectors
//

/** Get a specific task's state */
export const getTaskState = (taskId: string): TaskTrackerState | undefined => {
    return $taskStore.get().tasks.get(taskId);
};

/** Check if a task is being tracked */
export const isTaskTracked = (taskId: string): boolean => {
    return $taskStore.get().tasks.has(taskId);
};

//
// * Internal API (for taskService only)
//

export const registerTask = (taskId: string): void => {
    const current = $taskStore.get();
    if (current.tasks.has(taskId)) {
        return;
    }

    const newTasks = new Map(current.tasks);
    newTasks.set(taskId, {
        taskId,
        state: 'pending',
        progress: 0,
        startedAt: Date.now(),
    });
    $taskStore.set({tasks: newTasks});
};

export const updateTaskProgress = (taskId: string, taskInfo: TaskInfo, state: TaskProgressState): void => {
    const current = $taskStore.get();
    const existing = current.tasks.get(taskId);
    if (!existing) {
        return;
    }

    const newTasks = new Map(current.tasks);
    const progress = taskInfo.getProgressPercentage();

    console.log(`Task progress updated: ${taskId}, progress: ${progress}: ${taskInfo.getProgress().getInfo()} / ${taskInfo.getProgress().getCurrent()} / ${taskInfo.getProgress().getTotal()}`);

    newTasks.set(taskId, {
        ...existing,
        state,
        progress,
        taskInfo,
    });
    $taskStore.set({tasks: newTasks});
};

export const completeTask = (
    taskId: string,
    taskInfo: TaskInfo,
    resultState: TaskResultState,
    resultMessage: string
): void => {
    const current = $taskStore.get();
    const existing = current.tasks.get(taskId);
    if (!existing) {
        return;
    }

    console.log(`Task completed: ${taskId}`);

    const newTasks = new Map(current.tasks);
    newTasks.set(taskId, {
        ...existing,
        state: resultState === 'SUCCESS' ? 'finished' : 'failed',
        progress: resultState === 'SUCCESS' ? 100 : existing.progress,
        taskInfo,
        resultState,
        resultMessage,
    });
    $taskStore.set({tasks: newTasks});
};

export const unregisterTask = (taskId: string): void => {
    const current = $taskStore.get();
    if (!current.tasks.has(taskId)) {
        return;
    }

    console.log(`Task unregistered: ${taskId}`);

    const newTasks = new Map(current.tasks);
    newTasks.delete(taskId);
    $taskStore.set({tasks: newTasks});
};
