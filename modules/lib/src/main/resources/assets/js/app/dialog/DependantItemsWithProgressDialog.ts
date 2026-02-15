import {type TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {type TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {DependantItemsDialog, type DependantItemsDialogConfig} from './DependantItemsDialog';
import {TaskProgressManager, type WithTaskProgress} from './TaskProgressManager';

export interface DependantItemsWithProgressDialogConfig
    extends DependantItemsDialogConfig {
    processingLabel: string;
    processHandler: () => void;
}

export abstract class DependantItemsWithProgressDialog
    extends DependantItemsDialog
    implements WithTaskProgress {

    protected progressManager: TaskProgressManager;

    declare protected config: DependantItemsWithProgressDialogConfig;

    protected constructor(config: DependantItemsWithProgressDialogConfig) {
        super(config);
    }

    protected initElements() {
        super.initElements();

        // Initialize task progress manager with composition
        this.progressManager = new TaskProgressManager({
            processingLabel: this.config.processingLabel,
            processHandler: this.config.processHandler,
            unlockControlsHandler: () => {
                this.unlockControls();
            },
            managingElement: this
        });
    }

    isProgressBarEnabled(): boolean {
        return this.progressManager.isProgressBarEnabled();
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
        return this.progressManager.isExecuting();
    }

    setProcessingLabel(processingLabel: string): void {
        this.progressManager.setProcessingLabel(processingLabel);
    }

    protected showLoadMask() {
        if (!this.isProgressBarEnabled()) {
            super.showLoadMask();
        }
    }
}
