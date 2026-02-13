import {type DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type ContentWizardPanel} from './ContentWizardPanel';
import {type ThumbnailUploaderEl} from './ThumbnailUploaderEl';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {type ContentSummary} from '../content/ContentSummary';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export enum WorkflowStateStatus {
    INVALID = 'invalid',
    READY = 'ready',
    IN_PROGRESS = 'in-progress'
}

export class WorkflowStateManager {

    private wizard: ContentWizardPanel;

    private status: WorkflowStateStatus;

    private statusChangedListeners: ((status: WorkflowStateStatus) => void)[];

    constructor(wizard: ContentWizardPanel) {
        this.wizard = wizard;
        this.status = null;
        this.statusChangedListeners = [];
    }

    update() {
        const status: WorkflowStateStatus = this.createWorkflowStateStatus();
        const isStatusChanged: boolean = this.isWorkflowStateStatusChanged(status);

        if (isStatusChanged) {
            this.status = status;

            this.updateIcons();
            this.notifyStatusChanged(status);
        }
    }

    private updateIcons(): void {
        const thumbnailUploader: ThumbnailUploaderEl = this.wizard.getFormIcon();
        const toolbarIcon: DivEl = this.wizard.getMainToolbar()?.getStateIcon();
        const isStatusHidden: boolean = this.isStatusToBeHidden();

        thumbnailUploader.setStatus(this.status);
        thumbnailUploader.toggleClass('status-hidden', isStatusHidden);

        toolbarIcon?.toggleClass(WorkflowStateStatus.INVALID, WorkflowStateManager.isInvalid(this.status));
        toolbarIcon?.toggleClass(WorkflowStateStatus.READY, WorkflowStateManager.isReady(this.status));
        toolbarIcon?.toggleClass(WorkflowStateStatus.IN_PROGRESS, WorkflowStateManager.isInProgress(this.status));
        toolbarIcon?.toggleClass('status-hidden', isStatusHidden);
    }

    private isStatusToBeHidden(): boolean {
        return this.status === WorkflowStateStatus.READY && (this.isPublished() || this.isMoved());
    }

    private isWorkflowStateStatusChanged(status: WorkflowStateStatus) {
        if (ObjectHelper.noneDefined(status, this.status)) {
            return false;
        }

        return this.status !== status;
    }

    private createWorkflowStateStatus(): WorkflowStateStatus {
        const content: ContentSummaryAndCompareStatus = this.wizard.getContent();

        if (content == null) {
            return null;
        }

        const isValid: boolean = this.wizard.isValid();

        if (!isValid) {
            return WorkflowStateStatus.INVALID;
        }

        const hasUnsavedChanges: boolean = this.wizard.hasUnsavedChanges();
        const contentSummary: ContentSummary = content.getContentSummary();

        const isReady: boolean = isValid && !hasUnsavedChanges && contentSummary.isReady();

        if (isReady) {
            return WorkflowStateStatus.READY;
        }

        return WorkflowStateStatus.IN_PROGRESS;
    }

    private isPublished(): boolean {
        return this.wizard.getContent()?.isPublished();
    }

    private isMoved(): boolean {
        return this.wizard.getContent()?.isMoved();
    }

    static isReady(status: WorkflowStateStatus): boolean {
        return status === WorkflowStateStatus.READY;
    }

    static isInProgress(status: WorkflowStateStatus): boolean {
        return status === WorkflowStateStatus.IN_PROGRESS;
    }

    static isInvalid(status: WorkflowStateStatus): boolean {
        return status === WorkflowStateStatus.INVALID;
    }

    public onStatusChanged(listener: (status: WorkflowStateStatus) => void) {
        this.statusChangedListeners.push(listener);
    }

    public unStatusChanged(listener: () => void) {
        this.statusChangedListeners = this.statusChangedListeners.filter(curr => curr !== listener);
    }

    private notifyStatusChanged(status: WorkflowStateStatus) {
        this.statusChangedListeners.forEach(listener => listener(status));
    }
}
