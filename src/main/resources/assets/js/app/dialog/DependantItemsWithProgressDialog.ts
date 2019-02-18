import '../../api.ts';
import {DependantItemsDialog, DependantItemsDialogConfig} from '../dialog/DependantItemsDialog';
import ProgressBarManager = api.ui.dialog.ProgressBarManager;
import TaskId = api.task.TaskId;
import TaskState = api.task.TaskState;
import TaskProgressInterface = api.ui.dialog.TaskProgressInterface;
import applyMixins = api.ui.dialog.applyMixins;

export abstract class DependantItemsWithProgressDialog
    extends DependantItemsDialog
    implements TaskProgressInterface {

    progressManager: ProgressBarManager;

    protected config: DependantItemsWithProgressDialogConfig;

    isProgressBarEnabled: () => boolean;

    pollTask: (taskId: TaskId) => void;

    onProgressComplete: (listener: (taskState: TaskState) => void) => void;

    unProgressComplete: (listener: (taskState: TaskState) => void) => void;

    isExecuting: () => boolean;

    constructor(config: DependantItemsWithProgressDialogConfig) {
        super(config);
    }

    protected initElements() {
        super.initElements();

        TaskProgressInterface.prototype.constructor.call(this, {
            processingLabel: this.config.processingLabel,
            processHandler: this.config.processHandler,
            unlockControlsHandler: () => {
                this.unlockControls();
            },
            managingElement: this
        });
    }

    protected showLoadMask() {
        if (!this.isProgressBarEnabled()) {
            super.showLoadMask();
        }
    }
}

export interface DependantItemsWithProgressDialogConfig
    extends DependantItemsDialogConfig {
    processingLabel: string;
    processHandler: () => void;
}

applyMixins(DependantItemsWithProgressDialog, [TaskProgressInterface]);
