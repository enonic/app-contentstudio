import {applyMixins} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {DependantItemsDialog, DependantItemsDialogConfig} from './DependantItemsDialog';
import {ProgressBarManager} from 'lib-admin-ui/ui/dialog/ProgressBarManager';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {TaskState} from 'lib-admin-ui/task/TaskState';
import {TaskProgressInterface} from 'lib-admin-ui/ui/dialog/TaskProgressInterface';

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
