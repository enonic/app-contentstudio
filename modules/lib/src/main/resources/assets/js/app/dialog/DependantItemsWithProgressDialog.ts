import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {ContentItemElement} from '../../v6/features/shared/items/ContentItem';
import {DependantItemsDialog, DependantItemsDialogConfig} from './DependantItemsDialog';
import {StatusCheckableItem} from './StatusCheckableItem';
import {TaskProgressManager, WithTaskProgress} from './TaskProgressManager';

export interface DependantItemsWithProgressDialogConfig
    extends DependantItemsDialogConfig {
    processingLabel: string;
    processHandler: () => void;
}

/**
 * @deprecated Use React components instead (DeleteDialog, UnpublishDialog)
 */
export abstract class DependantItemsWithProgressDialog<Item extends StatusCheckableItem | ContentItemElement = StatusCheckableItem>
    extends DependantItemsDialog<Item>
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
