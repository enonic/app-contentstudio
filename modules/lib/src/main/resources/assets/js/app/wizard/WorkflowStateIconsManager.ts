import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {CompareStatus} from '../content/CompareStatus';
import {ContentWizardPanel} from './ContentWizardPanel';
import {ThumbnailUploaderEl} from './ThumbnailUploaderEl';

export interface WorkflowStateStatus {
    invalid: boolean;
    ready: boolean;
    inProgress: boolean;
    published: boolean;
}

export class WorkflowStateIconsManager {

    static INVALID_CLASS: string = 'invalid';

    static READY_CLASS: string = 'ready';

    static IN_PROGRESS_CLASS: string = 'in-progress';

    static PUBLISHED_CLASS: string = 'published';

    private wizard: ContentWizardPanel;

    private status: WorkflowStateStatus;

    private statusChangedListeners: ((status: WorkflowStateStatus) => void)[];

    constructor(wizard: ContentWizardPanel) {
        this.wizard = wizard;
        this.status = null;
        this.statusChangedListeners = [];
    }

    updateIcons() {
        const status = this.createWorkflowStateStatus();

        const isStatusChanged = this.isWorkflowStateStatusChanged(status);

        if (isStatusChanged) {
            const thumbnailUploader: ThumbnailUploaderEl = this.wizard.getFormIcon();
            const toolbarIcon: DivEl = this.wizard.getMainToolbar()?.getStateIcon();

            if (thumbnailUploader) {
                WorkflowStateIconsManager.toggleWorkflowStateClasses(thumbnailUploader, status);
            }

            if (toolbarIcon) {
                WorkflowStateIconsManager.toggleWorkflowStateClasses(toolbarIcon, status);
            }

            this.status = status;

            this.notifyStatusChanged(status);
        }
    }

    getStatus(): WorkflowStateStatus {
        return this.status;
    }

    isWorkflowStateStatusChanged(status: WorkflowStateStatus) {
        if (status == null && this.status == null) {
            return false;
        }

        return this.status == null || status == null ||
               this.status.inProgress !== status.inProgress ||
               this.status.invalid !== status.invalid ||
               this.status.ready !== status.ready;
    }

    createWorkflowStateStatus(): WorkflowStateStatus {
        const content = this.wizard.getContent();

        let invalid = false, ready = false, inProgress = false, published = false;

        if (content) {
            const contentSummary = content.getContentSummary();

            const isInWorkflow = this.wizard.isValid() && !content.isPendingDelete();
            const hasUnsavedChanges = this.wizard.hasUnsavedChanges();
            const isNotMoved = content.getCompareStatus() !== CompareStatus.MOVED;

            invalid = !this.wizard.isValid();
            published = isInWorkflow && isNotMoved && !content.isModified() && content.isPublished();
            ready = isInWorkflow && !published && !hasUnsavedChanges && contentSummary.isReady();
            inProgress = isInWorkflow && !published && (hasUnsavedChanges || contentSummary.isInProgress());
        }

        return {invalid, ready, inProgress, published};
    }

    static toggleWorkflowStateClasses(element: Element, status: WorkflowStateStatus) {
        element.toggleClass(WorkflowStateIconsManager.INVALID_CLASS, status.invalid);
        element.toggleClass(WorkflowStateIconsManager.READY_CLASS, status.ready);
        element.toggleClass(WorkflowStateIconsManager.IN_PROGRESS_CLASS, status.inProgress);
        element.toggleClass(WorkflowStateIconsManager.PUBLISHED_CLASS, status.published);
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
