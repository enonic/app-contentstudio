import {IssueDialog} from './IssueDialog';
import {CreateIssueRequest} from '../resource/CreateIssueRequest';
import {PublishRequest} from '../PublishRequest';
import {Issue} from '../Issue';
import LabelEl = api.dom.LabelEl;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import AEl = api.dom.AEl;
import i18n = api.util.i18n;
import PrincipalKey = api.security.PrincipalKey;

export class CreateIssueDialog
    extends IssueDialog {

    private static INSTANCE: CreateIssueDialog;

    private itemsLabel: LabelEl;

    private backButton: AEl;

    private issueCreatedListeners: { (issue: Issue): void }[] = [];

    protected constructor() {
        super(i18n('dialog.newIssue'));

        this.getEl().addClass('create-issue-dialog');

        this.initElements();
        this.initElementsListeners();
    }

    static get(): CreateIssueDialog {
        if (!CreateIssueDialog.INSTANCE) {
            CreateIssueDialog.INSTANCE = new CreateIssueDialog();
        }
        return CreateIssueDialog.INSTANCE;
    }

    private initElements() {
        this.addCancelButtonToBottom();
        this.itemsLabel = new LabelEl(i18n('field.items'), this.getItemList());
        this.backButton = this.createBackButton();
    }

    private initElementsListeners() {
        let onItemsChanged = (items) => {
            (<CreateIssueAction>this.actionButton.getAction()).updateLabel(this.getItemList().getItemCount());
        };

        this.getItemList().onItemsAdded(onItemsChanged);
        this.getItemList().onItemsRemoved(onItemsChanged);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.itemsLabel.insertBeforeEl(this.getItemList());
            this.prependChildToHeader(this.backButton);
            return rendered;
        });
    }

    public setItems(items: ContentSummaryAndCompareStatus[]): CreateIssueDialog {
        super.setItems(items);
        (<CreateIssueAction>this.actionButton.getAction()).updateLabel(this.countTotal());

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
                api.notify.showSuccess(i18n('notify.issue.created'));
                if (approvers.length > issue.getApprovers().length) {
                    api.notify.showWarning(i18n('notify.issue.assignees.norights'));
                }
                this.reset();
                this.notifyIssueCreated(issue);
            }).catch((reason) => {
                if (reason && reason.message) {
                    api.notify.showError(reason.message);
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

    protected initActions() {
        const createAction = new CreateIssueAction(this.countTotal());
        createAction.onExecuted(this.doCreateIssue.bind(this));
        this.actionButton = this.addAction(createAction, true);
    }

    public enableBackButton() {
        this.backButton.show();
        const cancelButton = this.getCancelButton();
        if (cancelButton) {
            cancelButton.hide();
        }
    }

    private disableBackButton() {
        this.backButton.hide();
        const cancelButton = this.getCancelButton();
        if (cancelButton) {
            cancelButton.show();
        }
    }

    private createBackButton(): AEl {
        const backButton: AEl = new AEl('back-button').setTitle(i18n('action.back'));

        backButton.hide();

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
    extends api.ui.Action {

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
