import {IssueDialog} from './IssueDialog';
import {CreateIssueRequest} from '../resource/CreateIssueRequest';
import {PublishRequest} from '../PublishRequest';
import {Issue} from '../Issue';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import LabelEl = api.dom.LabelEl;
import AEl = api.dom.AEl;
import i18n = api.util.i18n;
import PrincipalKey = api.security.PrincipalKey;

export class CreateIssueDialog
    extends IssueDialog {

    private static INSTANCE: CreateIssueDialog;

    private itemsLabel: LabelEl;

    private backButton: AEl;

    private createAction: CreateIssueAction;

    private issueCreatedListeners: { (issue: Issue): void }[] = [];

    protected constructor() {
        super(i18n('dialog.newIssue'));
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
