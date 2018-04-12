import '../../api.ts';
import {DependantItemsDialog, DependantItemsDialogConfig} from '../dialog/DependantItemsDialog';
import ProgressBarManager = api.ui.dialog.ProgressBarManager;
import TaskId = api.task.TaskId;
import TaskState = api.task.TaskState;
import ManagedActionExecutor = api.managedaction.ManagedActionExecutor;

export interface DependantItemsWithProgressDialogConfig
    extends DependantItemsDialogConfig {
    processingLabel: string;
    processHandler: () => void;
}

export class DependantItemsWithProgressDialog
    extends DependantItemsDialog
    implements ManagedActionExecutor {

    protected progressManager: ProgressBarManager;

    constructor(config: DependantItemsWithProgressDialogConfig) {
        super(config);
        this.progressManager = new ProgressBarManager({
            processingLabel: config.processingLabel,
            processHandler: config.processHandler,
            unlockControlsHandler: () => {
                this.unlockControls();
            },
            managingElement: this
        });
    }

    protected isProgressBarEnabled(): boolean {
        return this.progressManager.isEnabled();
    }

    protected pollTask(taskId: TaskId, elapsed: number = 0) {
        this.progressManager.pollTask(taskId, elapsed);
    }

    protected onProgressComplete(listener: (taskState: TaskState) => void) {
        this.progressManager.onProgressComplete(listener);
    }

    protected unProgressComplete(listener: (taskState: TaskState) => void) {
        this.progressManager.unProgressComplete(listener);
    }

    show() {
        super.show(this.isProgressBarEnabled());
    }

    isExecuting(): boolean {
        return this.progressManager.isActive();
    }
}
