import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ContentWizardPanel} from './ContentWizardPanel';
import {ThumbnailUploaderEl} from './ThumbnailUploaderEl';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummary} from '../content/ContentSummary';

export interface WorkflowStateStatus {
    invalid: boolean;
    ready: boolean;
    inProgress: boolean;
}

export class WorkflowStateManager {

    static INVALID_CLASS: string = 'invalid';

    static READY_CLASS: string = 'ready';

    static IN_PROGRESS_CLASS: string = 'in-progress';

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

        if (thumbnailUploader) {
            this.toggleWorkflowStateClasses(thumbnailUploader);
        }

        if (toolbarIcon) {
            this.toggleWorkflowStateClasses(toolbarIcon);
        }
    }

    private isWorkflowStateStatusChanged(status: WorkflowStateStatus) {
        if (status == null && this.status == null) {
            return false;
        }

        return this.status == null || status == null ||
               this.status.inProgress !== status.inProgress ||
               this.status.invalid !== status.invalid ||
               this.status.ready !== status.ready;
    }

    private createWorkflowStateStatus(): WorkflowStateStatus {
        const content: ContentSummaryAndCompareStatus = this.wizard.getContent();

        if (content == null) {
            return {
                invalid: false,
                ready: false,
                inProgress: false
            };
        }

        const contentSummary: ContentSummary = content.getContentSummary();
        const isValid: boolean = this.wizard.isValid();
        const isPendingDelete: boolean = content.isPendingDelete();
        const isInWorkflow: boolean = isValid && !isPendingDelete;
        const hasUnsavedChanges: boolean = this.wizard.hasUnsavedChanges();

        const isReady: boolean = isInWorkflow && !hasUnsavedChanges && contentSummary.isReady();
        const isInProgress: boolean = isInWorkflow && (hasUnsavedChanges || contentSummary.isInProgress());

        return {
            invalid: !isValid,
            ready: isReady,
            inProgress: isInProgress
        };
    }

    private toggleWorkflowStateClasses(element: Element) {
        element.toggleClass(WorkflowStateManager.INVALID_CLASS, this.status.invalid);
        element.toggleClass(WorkflowStateManager.READY_CLASS, this.isWorkflowReadyIconRequired());
        element.toggleClass(WorkflowStateManager.IN_PROGRESS_CLASS, this.status.inProgress);
    }

    private isWorkflowReadyIconRequired(): boolean {
        return this.status.ready && !this.isPublished() && !this.isMoved();
    }

    private isPublished(): boolean {
        return this.wizard.getContent()?.isPublished();
    }

    private isMoved(): boolean {
        return this.wizard.getContent()?.isMoved();
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
