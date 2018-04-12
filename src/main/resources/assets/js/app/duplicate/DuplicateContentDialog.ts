import '../../api.ts';
import {OpenDuplicateDialogEvent} from './OpenDuplicateDialogEvent';
import ProgressBarManager = api.ui.dialog.ProgressBarManager;
import TaskId = api.task.TaskId;
import i18n = api.util.i18n;
import SpanEl = api.dom.SpanEl;
import DuplicateContentRequest = api.content.resource.DuplicateContentRequest;
import ManagedActionExecutor = api.managedaction.ManagedActionExecutor;
import ContentSummary = api.content.ContentSummary;
import ContentIds = api.content.ContentIds;
import ManagedActionManager = api.managedaction.ManagedActionManager;
import ManagedActionState = api.managedaction.ManagedActionState;

export class DuplicateContentDialog
    extends api.ui.dialog.ModalDialog
    implements ManagedActionExecutor {

    private duplicatedContent: ContentSummary[];

    private progressManager: ProgressBarManager;

    constructor() {
        super();

        this.setTitle(i18n('dialog.duplicate'));

        this.addClass('duplicate-content-dialog');

        this.initProgressManager();

        this.listenOpenDuplicateDialogEvent();

        this.addCancelButtonToBottom();
    }

    private initProgressManager() {
        this.progressManager = new ProgressBarManager({
            processingLabel: `${i18n('field.progress.duplicating')}...`,
            processHandler: () => {
                this.open();
            },
            createProcessingMessage: () => {
                const messageElement = new SpanEl();
                if (this.duplicatedContent.length > 1) {
                    messageElement.setHtml(`${i18n('dialog.duplicate.progressMessage.multiple')} `);
                } else {
                    messageElement.setHtml(`${i18n('dialog.duplicate.progressMessage')} `)
                        .appendChild(new SpanEl('content-path').setHtml(this.duplicatedContent[0].getPath().toString()));
                }
                return messageElement;
            },
            managingElement: this
        });
    }

    private listenOpenDuplicateDialogEvent() {
        OpenDuplicateDialogEvent.on((event) => {
            this.duplicatedContent = event.getContentSummaries();

            const duplicationStartedHandler = (state: ManagedActionState, executor: ManagedActionExecutor) => {
                if (state === ManagedActionState.STARTED && executor === this) {
                    this.open();
                } else if (state === ManagedActionState.ENDED) {
                    ManagedActionManager.instance().unManagedActionStateChanged(duplicationStartedHandler);
                }
            };
            ManagedActionManager.instance().onManagedActionStateChanged(duplicationStartedHandler);

            this.doMove();
        });
    }

    private doMove() {
        const contentIds = ContentIds.fromContents(this.duplicatedContent);

        new DuplicateContentRequest(contentIds)
            .sendAndParse()
            .then((taskId: api.task.TaskId) => {
                this.pollTask(taskId);
            }).catch((reason) => {
            this.close();
            if (reason && reason.message) {
                api.notify.showError(reason.message);
            }
        });
    }

    private pollTask(taskId: TaskId, elapsed: number = 0) {
        this.progressManager.pollTask(taskId, elapsed);
    }

    show() {
        api.dom.Body.get().appendChild(this);
        super.show();
    }

    isExecuting(): boolean {
        return this.progressManager.isActive();
    }
}
