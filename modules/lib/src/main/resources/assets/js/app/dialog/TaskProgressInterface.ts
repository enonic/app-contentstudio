import {ManagedActionManager} from '@enonic/lib-admin-ui/managedaction/ManagedActionManager';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {ProgressBarManager, ProgressBarManagerConfig} from './ProgressBarManager';

export abstract class TaskProgressInterface {

    progressManager: ProgressBarManager;

    constructor(config: ProgressBarManagerConfig) {
        this.progressManager = new ProgressBarManager(config);

        ManagedActionManager.instance().addPerformer(config.managingElement);
        config.managingElement.onRemoved(() => ManagedActionManager.instance().removePerformer(config.managingElement));

        config.managingElement.addClass('progress-manageable');
    }

    isProgressBarEnabled(): boolean {
        return this.progressManager.isEnabled();
    }

    pollTask(taskId: TaskId) {
        this.progressManager.pollTask(taskId);
    }

    onProgressComplete(listener: (taskState: TaskState) => void) {
        this.progressManager.onProgressComplete(listener);
    }

    unProgressComplete(listener: (taskState: TaskState) => void) {
        this.progressManager.unProgressComplete(listener);
    }

    isExecuting(): boolean {
        return this.progressManager.isActive();
    }

    setProcessingLabel(processingLabel: string): void {
        this.progressManager.setProcessingLabel(processingLabel);
    }
}
