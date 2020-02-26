import {Element} from 'lib-admin-ui/dom/Element';
import {ContentWizardPanel} from './ContentWizardPanel';

export interface WorkflowStateStatus {
    invalid: boolean;
    ready: boolean;
    inProgress: boolean;
}

export class WorkflowStateIconsManager {

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

    updateIcons() {
        const status = this.createWorkflowStateStatus();
        const isStatusChanged = this.isWorkflowStateStatusChanged(status);

        if (isStatusChanged) {
            const toolbar = this.wizard.getMainToolbar();
            const toolbarIcon = toolbar != null ? toolbar.getStateIcon() : toolbar;
            const thumbnailUploader = this.wizard.getFormIcon();
            const icons = [thumbnailUploader, toolbarIcon].filter(icon => icon != null);

            icons.forEach(icon => WorkflowStateIconsManager.toggleWorkflowStateClasses(icon, status));

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

        if (content == null) {
            return {
                invalid: false,
                ready: false,
                inProgress: false
            };
        }

        const contentSummary = content.getContentSummary();

        const isValid = this.wizard.isValid();
        const isOnline = content.isOnline();
        const isPendingDelete = content.isPendingDelete();
        const isInWorkflow = isValid && !isOnline && !isPendingDelete;
        const hasUnsavedChanges = this.wizard.hasUnsavedChanges();

        const isReady: boolean = isInWorkflow && !hasUnsavedChanges && contentSummary.isReady();
        const isInProgress: boolean = isInWorkflow && (hasUnsavedChanges || contentSummary.isInProgress());

        return {
            invalid: !isValid,
            ready: isReady,
            inProgress: isInProgress
        };
    }

    static toggleWorkflowStateClasses(element: Element, status: WorkflowStateStatus) {
        element.toggleClass(WorkflowStateIconsManager.INVALID_CLASS, status.invalid);
        element.toggleClass(WorkflowStateIconsManager.READY_CLASS, status.ready);
        element.toggleClass(WorkflowStateIconsManager.IN_PROGRESS_CLASS, status.inProgress);
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
