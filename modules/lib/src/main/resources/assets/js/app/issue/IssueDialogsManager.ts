import {ModalDialog} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {ContentPublishPromptEvent} from '../browse/ContentPublishPromptEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentPublishDialog} from '../publish/ContentPublishDialog';
import {
    openIssueDialog,
    openIssueDialogDetails,
    setIssueDialogListFilter,
} from '../../v6/features/store/dialogs/issueDialog.store';
import {openNewIssueDialog} from '../../v6/features/store/dialogs/newIssueDialog.store';
import {openRequestPublishDialog} from '../../v6/features/store/dialogs/requestPublishDialog.store';
import {IssueServerEventsHandler} from './event/IssueServerEventsHandler';
import {Issue} from './Issue';
import {GetIssueRequest} from './resource/GetIssueRequest';
import {CreateIssueDialog} from './view/CreateIssueDialog';
import {IssueDetailsDialog} from './view/IssueDetailsDialog';
import {IssueListDialog} from './view/IssueListDialog';

export class IssueDialogsManager {

    private static INSTANCE: IssueDialogsManager;

    private detailsDialog: IssueDetailsDialog;
    private listDialog: IssueListDialog;
    private createDialog: CreateIssueDialog;
    private publishDialog: ContentPublishDialog;
    private getIssueRequest: GetIssueRequest;

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
            this.publishDialog.setKeepDependencies(false);
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
            if (!!this.getIssueRequest) {
                return;
            }
            this.getIssueRequest = new GetIssueRequest(issue.getId());
            this.getIssueRequest.sendAndParse().done(issueWithComments => {
                this.openDetailsDialogWithListDialog(issueWithComments);
                this.getIssueRequest = null;
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


    private static closeDialog(dialog: ModalDialog) {
        if (dialog.isOpen()) {
            dialog.close();
        }
    }

    openDetailsDialogWithListDialog(issue: Issue) {
        openIssueDialogDetails(issue.getId());
    }

    openDetailsDialog(issue: Issue) {
        openIssueDialogDetails(issue.getId());
    }

    openListDialog(assignedToMe: boolean = false) {
        openIssueDialog();
        setIssueDialogListFilter(assignedToMe ? 'assignedToMe' : 'all');
    }

    openCreateDialog(summaries?: ContentSummaryAndCompareStatus[]) {
        openNewIssueDialog(summaries);
    }

    openCreateRequestDialog(summaries?: ContentSummaryAndCompareStatus[], isIncludeChildren?: boolean) {
        openRequestPublishDialog(summaries, isIncludeChildren);
    }

}
