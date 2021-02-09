import {ModalDialog} from 'lib-admin-ui/ui/dialog/ModalDialog';
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
    private detailsDialogBackButtonClickedHandler: () => void;
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
            if (this.detailsDialog.isOpen()) {
                this.detailsDialog.getEl().focus();
            }
            this.publishDialog.unClosed(this.publishDialogCloseHandler);
            this.detailsDialog.onClosed(this.detailsDialogCloseHandler);
            IssueServerEventsHandler.getInstance().unIssueUpdated(this.issueUpdateHandler);
        };

        let backButtonClicked: boolean = false;
        this.detailsDialogCloseHandler = () => {
            if (backButtonClicked) {
                return;
            }
            this.listDialog.close();
        };
        this.detailsDialogBackButtonClickedHandler = () => {
            backButtonClicked = true;
            IssueDialogsManager.closeDialog(this.detailsDialog);
            backButtonClicked = false;
            if (this.listDialog.isOpen()) {
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
            new GetIssueRequest(issue.getId()).sendAndParse().done(issueWithComments => {
                this.openDetailsDialogWithListDialog(issueWithComments);
            });
        });
        this.listDialog.onCreateButtonClicked(() => {
            this.openCreateDialog();
        });
    }

    private listenDetailsDialog() {
        this.detailsDialog.onCloseButtonClicked(() => IssueDialogsManager.closeDialog(this.detailsDialog));
        this.detailsDialog.onClosed(this.detailsDialogCloseHandler);
        this.detailsDialog.onBackButtonClicked(this.detailsDialogBackButtonClickedHandler);
    }

    private listenPublishDialog() {
        ContentPublishPromptEvent.on(() => {
            if (this.detailsDialog.isOpen()) {
                this.detailsDialog.unClosed(this.detailsDialogCloseHandler);
                this.publishDialog.onCloseButtonClicked(this.publishDialogBeforeClosedHandler);
                this.publishDialog.onClosed(this.publishDialogCloseHandler);
                this.issue = this.detailsDialog.getIssue();
                IssueServerEventsHandler.getInstance().onIssueUpdated(this.issueUpdateHandler);
            }
        });
    }

    private listenRequestPublishDialog() {
        this.requestPublishDialog.onIssueCreated(issue => {
            if (this.requestPublishDialog.isOpen()) {
                if (this.requestPublishDialog.isIssueCreatedByCurrentUser(issue)) {
                    this.requestPublishDialog.close();
                }
            }
            IssueDialogsManager.get().openDetailsDialog(issue);
        });
    }

    private static closeDialog(dialog: ModalDialog) {
        if (dialog.isOpen()) {
            dialog.close();
        }
    }

    openDetailsDialogWithListDialog(issue: Issue) {
        if (!this.listDialog.isOpen()) {
            this.listDialog.open();
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
