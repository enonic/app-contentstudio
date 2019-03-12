import {IssueDetailsDialog} from './view/IssueDetailsDialog';
import {IssueListDialog} from './view/IssueListDialog';
import {Issue} from './Issue';
import {CreateIssueDialog} from './view/CreateIssueDialog';
import {GetIssueRequest} from './resource/GetIssueRequest';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import ModalDialog = api.ui.dialog.ModalDialog;

export class IssueDialogsManager {

    private static INSTANCE: IssueDialogsManager;

    private detailsDialog: IssueDetailsDialog;
    private listDialog: IssueListDialog;
    private createDialog: CreateIssueDialog;

    private issueCreatedListeners: { (issue: Issue): void }[] = [];
    private issueUpdatedListeners: { (issue: Issue): void }[] = [];

    private constructor() {
        this.detailsDialog = IssueDetailsDialog.get();
        this.listDialog = IssueListDialog.get();
        this.createDialog = CreateIssueDialog.get();

        this.listenCreateDialog(this.createDialog);
        this.listenListDialog(this.listDialog);
        this.listenDetailsDialog(this.detailsDialog);
    }

    static get(): IssueDialogsManager {
        if (!IssueDialogsManager.INSTANCE) {
            IssueDialogsManager.INSTANCE = new IssueDialogsManager();
        }
        return IssueDialogsManager.INSTANCE;
    }

    private listenCreateDialog(dialog: CreateIssueDialog) {
        // Create dialog
        let ignoreNextClosedEvent = false;
        dialog.onIssueCreated(issue => {
            ignoreNextClosedEvent = true;
            dialog.close();
            this.notifyIssueCreated(issue);
            this.openDetailsDialogWithListDialog(issue);
        });
        dialog.onClosed(() => {
            if (!ignoreNextClosedEvent) {
                this.revealDialog(this.listDialog);
            } else {
                ignoreNextClosedEvent = false;
            }
        });
        dialog.onCloseButtonClicked((e: MouseEvent) => this.closeDialog(this.listDialog));
    }

    private listenListDialog(dialog: IssueListDialog) {
        // List dialog
        dialog.onRendered(event => {
            dialog.addClickIgnoredElement(this.detailsDialog);
            dialog.addClickIgnoredElement(this.createDialog);
        });
        dialog.onIssueSelected(issue => {
            dialog.mask();
            new GetIssueRequest(issue.getId()).sendAndParse().done(issueWithComments => {
                this.openDetailsDialogWithListDialog(issueWithComments);
            });
        });
        dialog.onCreateButtonClicked(action => {
            dialog.mask();
            this.openCreateDialog();
        });
    }

    private listenDetailsDialog(dialog: IssueDetailsDialog) {
        // Details dialog
        dialog.onIssueUpdated(this.notifyIssueUpdated.bind(this));
        dialog.onCloseButtonClicked((e: MouseEvent) => this.closeDialog(this.listDialog));
        dialog.onClosed(() => this.revealDialog(this.listDialog));
    }

    private closeDialog(dialog: ModalDialog) {
        if (dialog.isVisible()) {
            dialog.unmask();
            dialog.close();
        }
    }

    private revealDialog(dialog: ModalDialog) {
        dialog.unmask();
        if (dialog.isVisible()) {
            dialog.getEl().focus();
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

    openListDialog(assignedToMe: boolean = false, createdByMe: boolean = false) {
        this.listDialog.open(assignedToMe, createdByMe);
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

    private notifyIssueCreated(issue: Issue) {
        this.issueCreatedListeners.forEach(listener => listener(issue));
    }

    public onIssueCreated(listener: (issue: Issue) => void) {
        this.issueCreatedListeners.push(listener);
    }

    public unIssueCreated(listener: (issue: Issue) => void) {
        this.issueCreatedListeners = this.issueCreatedListeners.filter(curr => curr !== listener);
    }

    private notifyIssueUpdated(issue: Issue) {
        this.issueUpdatedListeners.forEach(listener => listener(issue));
    }

    public onIssueUpdated(listener: (issue: Issue) => void) {
        this.issueUpdatedListeners.push(listener);
    }

    public unIssueUpdated(listener: (issue: Issue) => void) {
        this.issueUpdatedListeners = this.issueUpdatedListeners.filter(curr => curr !== listener);
    }

}
