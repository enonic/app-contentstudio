import {MenuButtonProgressBarManager} from '@enonic/lib-admin-ui/ui/button/MenuButtonProgressBarManager';
import {TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ManagedActionManager} from '@enonic/lib-admin-ui/managedaction/ManagedActionManager';
import {type ManagedActionExecutor} from '@enonic/lib-admin-ui/managedaction/ManagedActionExecutor';
import {ManagedActionState} from '@enonic/lib-admin-ui/managedaction/ManagedActionState';
import {TaskEvent, TaskEventType} from '@enonic/lib-admin-ui/task/TaskEvent';
import {type TaskInfo} from '@enonic/lib-admin-ui/task/TaskInfo';
import {type TaskProgress} from '@enonic/lib-admin-ui/task/TaskProgress';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {type TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {type ModalDialog} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {ProgressBar} from '@enonic/lib-admin-ui/ui/ProgressBar';
import {ProgressBarManagerState} from '@enonic/lib-admin-ui/ui/dialog/ProgressBarManagerState';
import {showError, showSuccess, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {GetTaskInfoRequest} from '../resource/GetTaskInfoRequest';

export type ManagedActionsModalDialog = ModalDialog & ManagedActionExecutor;

export interface ProgressBarManagerConfig {
    processingLabel: string;
    managingElement: ManagedActionsModalDialog;
    processHandler?: () => void;
    unlockControlsHandler?: () => void;
    createProcessingMessage?: () => Element;
    successHandler?: (message?: string) => void;
}

interface ProgressInfoJson {
    state: string,
    message: string
}

export class ProgressBarManager {

    static processingClass: string = 'is-processing';

    readonly managingElement: ManagedActionsModalDialog;

    private progressBar: ProgressBar;

    private processingMessageContainer: Element;

    readonly createProcessingMessage: () => Element;

    processingLabel: string;

    readonly processHandler: () => void;

    readonly unlockControlsHandler: () => void;

    private progressCompleteListeners: ((taskState: TaskState) => void)[] = [];

    private state: ProgressBarManagerState = ProgressBarManagerState.DISABLED;

    private taskHandler: (event: TaskEvent) => void;

    private suppressNotifications: boolean = false;

    private readonly successMessageHandler?: (message?: string) => void;

    constructor(config: ProgressBarManagerConfig) {
        this.managingElement = config.managingElement;
        this.processHandler = config.processHandler;
        this.processingLabel = config.processingLabel;
        this.unlockControlsHandler = config.unlockControlsHandler || (() => { /*empty*/
        });
        this.createProcessingMessage = config.createProcessingMessage;
        this.successMessageHandler = config.successHandler;

        ManagedActionManager.instance().addPerformer(this.managingElement);
        this.managingElement.onRemoved(() => ManagedActionManager.instance().removePerformer(this.managingElement));

        this.managingElement.addClass('progress-manageable');
    }

    setSuppressNotifications(value: boolean) {
        this.suppressNotifications = value;
    }

    isEnabled(): boolean {
        return this.state === ProgressBarManagerState.ENABLED;
    }

    isActive(): boolean {
        return this.state === ProgressBarManagerState.PREPARING || this.state === ProgressBarManagerState.ENABLED;
    }

    handleProcessingComplete() {
        if (this.isEnabled()) {
            this.disableProgressBar();
        } else {
            this.state = ProgressBarManagerState.DISABLED;
        }

        ManagedActionManager.instance().notifyManagedActionStateChanged(ManagedActionState.ENDED, this.managingElement);

        if (this.managingElement.isVisible()) {
            this.managingElement.close();
        }
    }

    onProgressComplete(listener: (taskState: TaskState) => void) {
        this.progressCompleteListeners.push(listener);
    }

    unProgressComplete(listener: (taskState: TaskState) => void) {
        this.progressCompleteListeners = this.progressCompleteListeners.filter(function (curr: (taskState: TaskState) => void) {
            return curr !== listener;
        });
    }

    pollTask(taskId: TaskId) {
        this.state = ProgressBarManagerState.PREPARING;
        ManagedActionManager.instance().notifyManagedActionStateChanged(ManagedActionState.PREPARING, this.managingElement);

        let taskEventsComing: boolean = false; // no events coming might mean that task is finished before we've got here

        this.taskHandler = (event: TaskEvent) => {
            if (!event.getTaskInfo().getId().equals(taskId)) {
                return;
            }

            if (event.getEventType() === TaskEventType.REMOVED) {
                return;
            }

            taskEventsComing = true;

            this.handleTaskEvent(event.getTaskInfo());
        };

        TaskEvent.on(this.taskHandler);

        // have to check if task was finished before we started listening task events
        new GetTaskInfoRequest(taskId).sendAndParse().then((taskInfo: TaskInfo) => {
            if (!taskEventsComing) {
                this.handleTaskEvent(taskInfo);
            }
        });
    }

    setProcessingLabel(processingLabel: string): void {
        this.processingLabel = processingLabel;
    }

    private createProgressBar() {
        if (this.progressBar) {
            this.progressBar.setValue(0);
        } else {
            this.progressBar = new ProgressBar(0);
            this.managingElement.appendChildToContentPanel(this.progressBar);
        }
    }

    private createProcessingMessageContainer() {
        if (this.createProcessingMessage) {
            if (this.processingMessageContainer) {
                this.processingMessageContainer.removeChildren();
                this.processingMessageContainer.appendChild(this.createProcessingMessage());
            } else {
                this.processingMessageContainer = new DivEl('progress-message');
                this.processingMessageContainer.appendChild(this.createProcessingMessage());
                this.managingElement.appendChildToContentPanel(this.processingMessageContainer);
            }
        }
    }

    private enableProgressBar() {
        this.managingElement.addClass(ProgressBarManager.processingClass);
        Body.get().addClass(ProgressBarManager.processingClass);
        this.state = ProgressBarManagerState.ENABLED;
        ManagedActionManager.instance().notifyManagedActionStateChanged(ManagedActionState.STARTED, this.managingElement);

        MenuButtonProgressBarManager.getProgressBar().setValue(0);
        MenuButtonProgressBarManager.getProgressBar().setLabel(this.processingLabel);
        this.unlockControlsHandler();
        this.createProcessingMessageContainer();
        this.createProgressBar();
        MenuButtonProgressBarManager.updateProgressHandler(this.processHandler);
    }

    private disableProgressBar() {
        this.managingElement.removeClass(ProgressBarManager.processingClass);
        Body.get().removeClass(ProgressBarManager.processingClass);
        this.state = ProgressBarManagerState.DISABLED;
    }

    private setProgressValue(value: number) {
        if (this.state === ProgressBarManagerState.ENABLED) {
            this.progressBar.setValue(value);
            if (!Body.get().isShowingModalDialog()) {
                MenuButtonProgressBarManager.getProgressBar().setValue(value);
            }
        }
    }

    private handleSucceeded(message: string) {
        this.setProgressValue(100);
        this.handleSuccessMessage(message);
        this.notifyProgressComplete(TaskState.FINISHED);
        this.handleProcessingComplete();
    }

    private handleSuccessMessage(message): void {
        if (this.successMessageHandler) {
            this.successMessageHandler(message);
        } else if (!this.suppressNotifications) {
            showSuccess(message);
        }
    }

    private handleFailed(message: string) {
        if (!this.suppressNotifications) {
            showError(i18n('notify.process.failed', message));
        }
        this.notifyProgressComplete(TaskState.FAILED);
        this.handleProcessingComplete();
    }

    private handleWarning(message: string) {
        if (!this.suppressNotifications) {
            showWarning(message);
        }
        this.notifyProgressComplete(TaskState.FAILED);
        this.handleProcessingComplete();
    }

    private notifyProgressComplete(taskState: TaskState) {
        this.progressCompleteListeners.forEach((listener) => {
            listener(taskState);
        });
    }

    private handleTaskEvent(taskInfo: TaskInfo) {
        if (taskInfo.getState() === TaskState.FINISHED) {
            this.handleTaskFinished(taskInfo);
        } else if (taskInfo.getState() === TaskState.FAILED) {
            this.handleTaskFailed(taskInfo);
        } else {
            this.handleTaskProgress(taskInfo);
        }
    }

    private handleTaskFinished(taskInfo: TaskInfo) {
        const progressInfoJson: ProgressInfoJson = this.getProgressInfoJson(taskInfo.getProgress());

        switch (progressInfoJson.state) {
        case 'ERROR':
            this.handleFailed(progressInfoJson.message);
            break;
        case 'SUCCESS':
            this.handleSucceeded(progressInfoJson.message);
            break;
        case 'WARNING':
            this.handleWarning(progressInfoJson.message);
            break;
        }

        TaskEvent.un(this.taskHandler);
    }

    private handleTaskFailed(taskInfo: TaskInfo) {
        const progressInfoJson: ProgressInfoJson = this.getProgressInfoJson(taskInfo.getProgress());
        this.handleFailed(progressInfoJson.message);

        TaskEvent.un(this.taskHandler);
    }

    private handleTaskProgress(taskInfo: TaskInfo) {
        if (!this.isEnabled()) {
            this.enableProgressBar();
        }
        this.setProgressValue(taskInfo.getProgressPercentage());
    }

    private getProgressInfoJson(taskProgress: TaskProgress): ProgressInfoJson {
        let progressJson;
        try {
            progressJson = JSON.parse(taskProgress.getInfo());
        } catch (e) {
            // the info is not in JSON format
            progressJson = {
                state: 'SUCCESS',
                message: taskProgress.getInfo()
            };
        }

        return progressJson;
    }
}
