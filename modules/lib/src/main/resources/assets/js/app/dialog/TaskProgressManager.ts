import {ManagedActionManager} from '@enonic/lib-admin-ui/managedaction/ManagedActionManager';
import {type TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {type TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {type ManagedActionsModalDialog, ProgressBarManager} from './ProgressBarManager';

export interface WithTaskProgress {
    isProgressBarEnabled(): boolean;
    pollTask(taskId: TaskId): void;
    onProgressComplete(listener: (taskState: TaskState) => void): void;
    unProgressComplete(listener: (taskState: TaskState) => void): void;
    isExecuting(): boolean;
    setProcessingLabel(processingLabel: string): void;
}

export interface TaskProgressManagerConfig {
    processingLabel: string;
    processHandler?: () => void;
    unlockControlsHandler?: () => void;
    managingElement: ManagedActionsModalDialog & WithTaskProgress;
}

export class TaskProgressManager implements WithTaskProgress {
    private progressManager: ProgressBarManager;

    constructor(config: TaskProgressManagerConfig) {
        this.progressManager = new ProgressBarManager(config);

        ManagedActionManager.instance().addPerformer(config.managingElement);
        config.managingElement.onRemoved(() => ManagedActionManager.instance().removePerformer(config.managingElement));

        config.managingElement.addClass('progress-manageable');
    }

    isProgressBarEnabled(): boolean {
        return this.progressManager.isEnabled();
    }

    pollTask(taskId: TaskId): void {
        this.progressManager.pollTask(taskId);
    }

    onProgressComplete(listener: (taskState: TaskState) => void): void {
        this.progressManager.onProgressComplete(listener);
    }

    unProgressComplete(listener: (taskState: TaskState) => void): void {
        this.progressManager.unProgressComplete(listener);
    }

    isExecuting(): boolean {
        return this.progressManager.isActive();
    }

    setProcessingLabel(processingLabel: string): void {
        this.progressManager.setProcessingLabel(processingLabel);
    }

    setSuppressNotifications(value: boolean = false): void {
        this.progressManager.setSuppressNotifications(value);
    }
}
