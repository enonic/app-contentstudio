import * as Q from 'q';
import {showError, showSuccess, showWarning} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {IssueDialog} from './IssueDialog';
import {CreateIssueRequest} from '../resource/CreateIssueRequest';
import {PublishRequest} from '../PublishRequest';
import {Issue} from '../Issue';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {LabelEl} from 'lib-admin-ui/dom/LabelEl';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {Action} from 'lib-admin-ui/ui/Action';
import {DependantItemsDialogConfig} from '../../dialog/DependantItemsDialog';

export class CreateIssueDialog
    extends IssueDialog {

    private static INSTANCE: CreateIssueDialog;

    private itemsLabel: LabelEl;

    private backButton: AEl;

    private createAction: CreateIssueAction;

    private issueCreatedListeners: { (issue: Issue): void }[] = [];

    protected constructor() {
        super(<DependantItemsDialogConfig>{
            title: i18n('dialog.newTask'),
            allowOverflow: true
        });
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

    protected initListeners() {
        super.initListeners();

        const onItemsChanged = (items) => {
            (<CreateIssueAction>this.createAction).updateLabel(this.getItemList().getItemCount());
        };
        this.getItemList().onItemsAdded(onItemsChanged);
        this.getItemList().onItemsRemoved(onItemsChanged);

        this.createAction.onExecuted(this.doCreateIssue.bind(this));
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

    public setItems(items: ContentSummaryAndCompareStatus[]): CreateIssueDialog {
        super.setItems(items);
        this.createAction.updateLabel(this.countTotal());

        return this;
    }

    private doCreateIssue() {

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
        let label = i18n('action.createTask');
        if (count > 1) {
            label += ' (' + count + ')';
        }
        this.setLabel(label);
    }
}
