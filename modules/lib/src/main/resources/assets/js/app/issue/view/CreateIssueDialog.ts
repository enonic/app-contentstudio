import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LabelEl} from '@enonic/lib-admin-ui/dom/LabelEl';
import {showError, showSuccess, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {type PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import type Q from 'q';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {DialogStateBar} from '../../dialog/DialogStateBar';
import {type Issue} from '../Issue';
import {PublishRequest} from '../PublishRequest';
import {CreateIssueRequest} from '../resource/CreateIssueRequest';
import {IssueDialog, type IssueDialogConfig} from './IssueDialog';

export class CreateIssueDialog
    extends IssueDialog {

    private static INSTANCE: CreateIssueDialog;

    private itemsLabel: LabelEl;

    private backButton: AEl;

    private createAction: CreateIssueAction;

    protected stateBar: DialogStateBar;

    private issueCreatedListeners: ((issue: Issue) => void)[] = [];

    protected constructor() {
        super({
            title: i18n('text.newIssue'),
            controls: true,
        } satisfies IssueDialogConfig);
    }

    static get(): CreateIssueDialog {
        if (!CreateIssueDialog.INSTANCE) {
            CreateIssueDialog.INSTANCE = new CreateIssueDialog();
        }
        return CreateIssueDialog.INSTANCE;
    }

    protected initElements() {
        super.initElements();

        this.itemsLabel = new LabelEl(i18n('field.items'), this.getItemList());
        this.backButton = this.createBackButton();
        this.createAction = new CreateIssueAction(this.countTotal());
        this.actionButton = this.addAction(this.createAction, true);
    }

    protected initDependants(): void {
        super.initDependants();

        this.initStateBar();
    }

    protected initStateBar(): void {
        this.stateBar = new DialogStateBar({
            failText: i18n('dialog.publish.error.loadFailed'),
            resolvedText: i18n('dialog.publish.error.resolved'),
            hideIfResolved: true,
            edit: {
                applyHandler: () => {
                    this.getDependantList().saveExclusions();
                    this.markEditing(false);
                },
                cancelHandler: () => {
                    this.getDependantList().restoreExclusions();
                    this.markEditing(false);
                },
            }
        });

        this.stateBar.insertBeforeEl(this.dependantsControls);
    }

    protected initListeners(): void {
        super.initListeners();

        this.getDependantList().onSelectionChanged((original) => {
            this.stateBar.markEditing(!original);
            this.markEditing(!original);
        });

        const onItemsChanged = () => {
            this.createAction.updateLabel(this.getItemList().getItemCount());
        };
        this.getItemList().onItemsAdded(onItemsChanged);
        this.getItemList().onItemsRemoved(onItemsChanged);

        this.createAction.onExecuted(() => this.doCreateIssue());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.getEl().addClass('create-issue-dialog');
            this.itemsLabel.insertBeforeEl(this.getItemList());
            const issueIcon = new DivEl('icon-issue opened');
            this.prependChildToHeader(issueIcon);
            this.prependChildToHeader(this.backButton);
            this.addCancelButtonToBottom();

            return rendered;
        });
    }

    public setItems(items: ContentSummaryAndCompareStatus[], silent?: boolean): CreateIssueDialog {
        super.setItems(items, silent);
        this.createAction.updateLabel(this.countTotal());

        return this;
    }

    private doCreateIssue(): void {
        const valid = this.form.validate(true).isValid();

        this.displayValidationErrors(!valid);

        if (valid) {
            const approvers: PrincipalKey[] = this.form.getApprovers();
            const createIssueRequest = new CreateIssueRequest()
                .setApprovers(approvers)
                .setPublishRequest(
                    PublishRequest.create()
                        .addExcludeIds(this.getExcludedIds())
                        .addPublishRequestItems(this.createPublishRequestItems())
                        .build()
                ).setDescription(this.form.getDescription()).setTitle(this.form.getTitle());

            createIssueRequest.sendAndParse().then((issue) => {
                showSuccess(i18n('notify.issue.created'));
                if (approvers.length > issue.getApprovers().length) {
                    showWarning(i18n('notify.issue.assignees.norights'));
                }
                this.reset();
                this.notifyIssueCreated(issue);
            }).catch((reason) => {
                if (reason && reason.message) {
                    showError(reason.message);
                }
            });
        }
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

    public lockPublishItems() {
        this.itemsLabel.show();

        super.lockPublishItems();
    }

    public unlockPublishItems() {
        this.itemsLabel.hide();
        super.unlockPublishItems();
    }

    private disableBackButton() {
        this.backButton.hide();
        const cancelButton = this.getCancelButton();
        if (cancelButton) {
            cancelButton.show();
        }
    }

    private createBackButton(): AEl {
        const backButton: AEl = new AEl('back-button');
        backButton.setTitle(i18n('action.back')).hide();

        backButton.onClicked(() => {
            this.close();
        });

        return backButton;
    }

    close() {
        super.close();

        this.stateBar.reset();
        this.disableBackButton();
    }
}

export class CreateIssueAction
    extends Action {

    constructor(itemCount: number) {
        super();
        this.updateLabel(itemCount);
        this.setIconClass('create-issue-action');
    }

    public updateLabel(count: number) {
        let label = i18n('action.createIssue');
        if (count > 1) {
            label += ' (' + count + ')';
        }
        this.setLabel(label);
    }
}
