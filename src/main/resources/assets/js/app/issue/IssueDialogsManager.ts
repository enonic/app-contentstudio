import {IssueDetailsDialog} from './view/IssueDetailsDialog';
import {IssueListDialog} from './view/IssueListDialog';
import {Issue} from './Issue';
import {CreateIssueDialog} from './view/CreateIssueDialog';
import {GetIssueRequest} from './resource/GetIssueRequest';
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import ModalDialog = api.ui.dialog.ModalDialog;

export class IssueDialogsManager {

    private static INSTANCE: IssueDialogsManager;

    private detailsDialog: IssueDetailsDialog;
    private listDialog: IssueListDialog;
    private createDialog: CreateIssueDialog;

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
            this.openDetailsDialog(issue);
            dialog.close();
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
            dialog.addClass('masked');
            new GetIssueRequest(issue.getId()).sendAndParse().done(issueWithComments => {
                this.openDetailsDialog(issueWithComments);
            });
        });
        dialog.onCreateButtonClicked(action => {
            dialog.addClass('masked');
            this.openCreateDialog();
        });
    }

    private listenDetailsDialog(dialog: IssueDetailsDialog) {
        // Details dialog
        dialog.onCloseButtonClicked((e: MouseEvent) => this.closeDialog(this.listDialog));
        dialog.onClosed(() => this.revealDialog(this.listDialog));
    }

    private closeDialog(dialog: ModalDialog) {
        dialog.removeClass('masked');
        dialog.close();
    }

    private revealDialog(dialog: ModalDialog) {
        dialog.removeClass('masked');
        if (dialog.isVisible()) {
            dialog.getEl().focus();
        }
    }

    openDetailsDialog(issue: Issue) {
        if (!this.listDialog.isVisible()) {
            this.listDialog.open();
            this.listDialog.addClass('masked');
        }

        this.detailsDialog.setIssue(issue).open();
    }

    openListDialog() {
        this.listDialog.open();
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

}
