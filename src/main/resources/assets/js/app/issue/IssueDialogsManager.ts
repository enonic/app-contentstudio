import {IssueDetailsDialog} from './view/IssueDetailsDialog';
import {IssueListDialog} from './view/IssueListDialog';
import {Issue} from './Issue';
import {CreateIssueDialog} from './view/CreateIssueDialog';
import {GetIssueRequest} from './resource/GetIssueRequest';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentPublishDialog} from '../publish/ContentPublishDialog';
import {ContentPublishPromptEvent} from '../browse/ContentPublishPromptEvent';
import {IssueServerEventsHandler} from './event/IssueServerEventsHandler';
import {RequestContentPublishDialog} from '../publish/RequestContentPublishDialog';
import ModalDialog = api.ui.dialog.ModalDialog;

export class IssueDialogsManager {

    private static INSTANCE: IssueDialogsManager;

    private detailsDialog: IssueDetailsDialog;
    private listDialog: IssueListDialog;
    private createDialog: CreateIssueDialog;
    private publishDialog: ContentPublishDialog;
    private requestPublishDialog: RequestContentPublishDialog;

    private issue: Issue;

    private publishDialogBeforeClosedHandler: () => void;
    private publishDialogCloseHandler: () => void;
    private detailsDialogCloseHandler: () => void;
    private issueUpdateHandler: (issues: Issue[]) => void;

    private constructor() {
        this.detailsDialog = IssueDetailsDialog.get();
        this.listDialog = IssueListDialog.get();
        this.createDialog = CreateIssueDialog.get();
        this.publishDialog = ContentPublishDialog.get();
        this.requestPublishDialog = RequestContentPublishDialog.get();

        this.initHandlers();
        this.initListeners();
    }

    static get(): IssueDialogsManager {
        if (!IssueDialogsManager.INSTANCE) {
            IssueDialogsManager.INSTANCE = new IssueDialogsManager();
        }
        return IssueDialogsManager.INSTANCE;
    }

    protected initHandlers() {
        this.publishDialogBeforeClosedHandler = () => {
            IssueDialogsManager.closeDialog(this.publishDialog);
            this.publishDialog.unCloseButtonClicked(this.publishDialogBeforeClosedHandler);
        };
        this.publishDialogCloseHandler = () => {
            this.detailsDialog.unmask();
            if (this.detailsDialog.isVisible()) {
                this.detailsDialog.getEl().focus();
            }
            this.publishDialog.unClosed(this.publishDialogCloseHandler);
            this.detailsDialog.onClosed(this.detailsDialogCloseHandler);
            IssueServerEventsHandler.getInstance().unIssueUpdated(this.issueUpdateHandler);
        };
        this.detailsDialogCloseHandler = () => {
            this.listDialog.unmask();
            if (this.listDialog.isVisible()) {
                this.listDialog.getEl().focus();
            }
        };
        this.issueUpdateHandler = (issues: Issue[]) => {
            issues.some(issue => {
                if (issue.getId() === this.issue.getId()) {
                    this.issue = issue;
                    return true;
                }
                return false;
            });
        };
    }

    protected initListeners() {
        this.listenCreateDialog();
        this.listenListDialog();
        this.listenDetailsDialog();
        this.listenPublishDialog();
        this.listenRequestPublishDialog();
    }

    private listenCreateDialog() {
        let ignoreNextClosedEvent = false;
        this.createDialog.onIssueCreated(issue => {
            ignoreNextClosedEvent = true;
            this.createDialog.close();
            this.openDetailsDialogWithListDialog(issue);
        });
        this.createDialog.onClosed(() => {
            if (!ignoreNextClosedEvent) {
                this.detailsDialogCloseHandler();
            } else {
                ignoreNextClosedEvent = false;
            }
        });
        this.createDialog.onCloseButtonClicked(() => IssueDialogsManager.closeDialog(this.listDialog));
    }

    private listenListDialog() {
        this.listDialog.onRendered(() => {
            this.listDialog.addClickIgnoredElement(this.detailsDialog);
            this.listDialog.addClickIgnoredElement(this.createDialog);
        });
        this.listDialog.onIssueSelected(issue => {
            this.listDialog.mask();
            new GetIssueRequest(issue.getId()).sendAndParse().done(issueWithComments => {
                this.openDetailsDialogWithListDialog(issueWithComments);
            });
        });
        this.listDialog.onCreateButtonClicked(() => {
            this.listDialog.mask();
            this.openCreateDialog();
        });
    }

    private listenDetailsDialog() {
        this.detailsDialog.onCloseButtonClicked(() => IssueDialogsManager.closeDialog(this.detailsDialog));
        this.detailsDialog.onClosed(this.detailsDialogCloseHandler);
    }

    private listenPublishDialog() {
        ContentPublishPromptEvent.on(() => {
            if (this.detailsDialog.isVisible()) {
                this.detailsDialog.unClosed(this.detailsDialogCloseHandler);
                this.publishDialog.onCloseButtonClicked(this.publishDialogBeforeClosedHandler);
                this.publishDialog.onClosed(this.publishDialogCloseHandler);
                this.issue = this.detailsDialog.getIssue();
                this.detailsDialog.mask();
                IssueServerEventsHandler.getInstance().onIssueUpdated(this.issueUpdateHandler);
            }
        });
    }

    private listenRequestPublishDialog() {
        this.requestPublishDialog.onIssueCreated(issue => {
            if (this.requestPublishDialog.isVisible()) {
                if (this.requestPublishDialog.isIssueCreatedByCurrentUser(issue)) {
                    this.requestPublishDialog.close();
                }
            }
            IssueDialogsManager.get().openDetailsDialog(issue);
        });
    }

    private static closeDialog(dialog: ModalDialog) {
        if (dialog.isVisible()) {
            dialog.unmask();
            dialog.close();
        }
    }

    openDetailsDialogWithListDialog(issue: Issue) {
        if (!this.listDialog.isVisible()) {
            this.listDialog.open();
            this.listDialog.mask();
        }

        this.detailsDialog.showBackButton();
        this.detailsDialog.setIssue(issue).open();
    }

    openDetailsDialog(issue: Issue) {
        this.detailsDialog.hideBackButton();
        this.detailsDialog.setIssue(issue).open();
    }

    openListDialog(assignedToMe: boolean = false) {
        this.listDialog.open(assignedToMe);
    }

    openCreateDialog(summaries?: ContentSummaryAndCompareStatus[]) {
        this.createDialog.unlockPublishItems();
        if (summaries) {
            this.createDialog.setItems(summaries);
        } else {
            this.createDialog.reset();
        }
        this.createDialog
            .forceResetOnClose(true)
            .open();
    }

    openCreateRequestDialog(summaries?: ContentSummaryAndCompareStatus[], isIncludeChildren?: boolean) {
        this.requestPublishDialog
            .setContentToPublish(summaries)
            .setIncludeChildItems(isIncludeChildren)
            .open();
    }

}
