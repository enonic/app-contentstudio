import {ContentPublishPromptEvent} from '../browse/ContentPublishPromptEvent';
import {Issue} from '../issue/Issue';
import {ContentPublishDialogAction} from './ContentPublishDialogAction';
import {DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {BasePublishDialog} from '../dialog/BasePublishDialog';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {CreateIssueRequest} from '../issue/resource/CreateIssueRequest';
import {PublishRequest} from '../issue/PublishRequest';
import {PublishRequestItem} from '../issue/PublishRequestItem';
import {IssueType} from '../issue/IssueType';
import Action = api.ui.Action;
import i18n = api.util.i18n;
import PropertyEvent = api.data.PropertyEvent;
import TextLine = api.form.inputtype.text.TextLine;
import PrincipalSelector = api.form.inputtype.principal.PrincipalSelector;
import ArrayHelper = api.util.ArrayHelper;
import PrincipalType = api.security.PrincipalType;

/**
 * ContentPublishDialog manages list of initially checked (initially requested) items resolved via ResolvePublishDependencies command.
 * Resolved items are converted into array of SelectionPublishItem<ContentPublishItem> items and stored in selectionItems property.
 * Dependant items number will change depending on includeChildren checkbox state as
 * resolved dependencies usually differ in that case.
 */
export class RequestContentPublishDialog
    extends BasePublishDialog {

    private static INSTANCE: RequestContentPublishDialog;

    private requestPublishAction: Action;

    private requestDetailsPropertySet: api.data.PropertySet;

    private requestDetailsStep: api.dom.DivEl;

    private publishItemsStep: api.dom.DivEl;

    private prevAction: api.ui.Action;

    private nextAction: api.ui.Action;

    private detailsFormView: api.form.FormView;

    private issueCreatedListeners: { (issue: Issue): void }[] = [];

    protected constructor() {
        super(<DependantItemsWithProgressDialogConfig>{
            title: i18n('dialog.requestPublish'),
            dialogSubName: i18n('dialog.requestPublish.subname1'),
            class: 'request-publish-dialog grey-header',
            dependantsDescription: i18n('dialog.publish.dependants'),
            processingLabel: `${i18n('field.progress.publishing')}...`,
            processHandler: () => new ContentPublishPromptEvent({model: []}).fire()
        });
    }

    public static get(): RequestContentPublishDialog {
        if (!RequestContentPublishDialog.INSTANCE) {
            RequestContentPublishDialog.INSTANCE = new RequestContentPublishDialog();
        }

        return RequestContentPublishDialog.INSTANCE;
    }

    protected initActions() {
        super.initActions();

        this.requestPublishAction = new ContentPublishDialogAction(() => {
            this.doRequestPublish();
        }, i18n('action.createRequest'));

        this.prevAction = new api.ui.Action(i18n('action.previous')).onExecuted(() => this.goToStep(0));
        this.nextAction = new api.ui.Action(i18n('action.next')).onExecuted(() => this.goToStep(1));
    }

    protected initElements() {
        super.initElements();

        this.actionButton = this.addAction(this.requestPublishAction);

        this.requestDetailsPropertySet = new api.data.PropertySet();

        this.publishScheduleForm.layout(false);


        const detailsForm = this.createDetailsForm();

        this.publishItemsStep = new api.dom.DivEl('publish-items-step');
        this.requestDetailsStep = new api.dom.DivEl('request-details-step');

        this.detailsFormView = new api.form.FormView(api.form.FormContext.create().build(), detailsForm, this.requestDetailsPropertySet);
        this.detailsFormView.displayValidationErrors(false);
        this.detailsFormView.layout(false);

        this.requestDetailsPropertySet.onChanged((event: PropertyEvent) => {
            this.detailsFormView.validate(false, true);
            this.detailsFormView.displayValidationErrors(!this.detailsFormView.getData().isEmpty());

            this.updateControls();
        });
    }

    protected initListeners() {
        super.initListeners();

        this.publishProcessor.onLoadingFailed(() => {
            this.setSubTitle(i18n('dialog.requestPublish.error.loadFailed'));
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildToContentPanel(this.publishIssuesStateBar);

            this.publishItemsStep.appendChildren(this.getItemList(), this.getDependantsContainer());
            this.appendChildToContentPanel(this.publishItemsStep);

            this.requestDetailsStep.appendChildren<api.dom.Element>(this.publishScheduleForm, this.detailsFormView);
            this.appendChildToContentPanel(this.requestDetailsStep);

            this.addAction(this.prevAction).addClass('force-enabled').addClass('prev');
            this.addAction(this.nextAction).addClass('force-enabled').addClass('next');

            return rendered;
        });
    }

    private createDetailsForm(): api.form.Form {
        const changes = new api.form.InputBuilder()
            .setName('changes')
            .setLabel(i18n('dialog.requestPublish.changes'))
            .setInputType(TextLine.getName())
            .setOccurrences(new api.form.OccurrencesBuilder().setMinimum(1).setMaximum(1).build())
            .setMaximizeUIInputWidth(true)
            .build();

        const assignees = new api.form.InputBuilder()
            .setName('assignees')
            .setLabel(i18n('dialog.requestPublish.assignees'))
            .setInputType(PrincipalSelector.getName())
            .setOccurrences(new api.form.OccurrencesBuilder().setMinimum(0).setMaximum(0).build())
            .setInputTypeConfig({
                principalTypes: PrincipalType[PrincipalType.USER],
                skipPrincipals: [api.security.PrincipalKey.ofAnonymous(), api.security.PrincipalKey.ofSU()]
            })
            .build();

        return new api.form.FormBuilder().addFormItem(changes).addFormItem(assignees).build();
    }

    private goToStep(num: number) {
        this.requestPublishAction.setVisible(num === 1);
        this.publishItemsStep.setVisible(num === 0);
        this.requestDetailsStep.setVisible(num === 1);
        this.prevAction.setVisible(num === 1);
        this.nextAction.setVisible(num === 0);
        this.setSubTitle(i18n(`dialog.requestPublish.subname${this.getCurrentStep() + 1}`));
        this.updateControls();
    }

    private getCurrentStep(): number {
        return this.detailsFormView.isVisible() ? 1 : 0;
    }

    open() {
        this.publishScheduleForm.setFormVisible(false, true);   // form will be reset on hide as well

        this.requestDetailsPropertySet.reset();
        this.detailsFormView.update(this.requestDetailsPropertySet, false);
        this.goToStep(0);

        super.open();
    }

    private doRequestPublish() {

        this.lockControls();
        this.publishProcessor.setIgnoreDependantItemsChanged(true);

        const selectedIds = this.getContentToPublishIds();
        const exludeChildrenIds = this.getItemList().getExcludeChildrenIds();
        const publishRequest = PublishRequest.create()
            .addPublishRequestItems(selectedIds.map(id =>
                PublishRequestItem.create()
                    .setId(id)
                    .setIncludeChildren(!ArrayHelper.contains(exludeChildrenIds, id))
                    .build()))
            .addExcludeIds(this.getExcludedIds())
            .build();

        const publishSet = this.scheduleFormPropertySet.getPropertySet('publish');
        const from = publishSet ? publishSet.getLocalDateTime('from') : null;
        const to = publishSet ? publishSet.getLocalDateTime('to') : null;
        const changes = this.requestDetailsPropertySet.getString('changes');
        const assignees = this.requestDetailsPropertySet.getPropertyArray('assignees');

        const createIssueRequest = new CreateIssueRequest()
            .setTitle(changes)
            .setType(IssueType.PUBLISH_REQUEST)
            .setPublishFrom(from ? from.toDate() : undefined)
            .setPublishTo(to ? to.toDate() : undefined)
            .setApprovers(assignees ? assignees.map((prop) => {
                return api.security.PrincipalKey.fromString(prop.getReference().getNodeId());
            }) : undefined)
            .setPublishRequest(publishRequest);

        createIssueRequest.sendAndParse().then((issue: Issue) => {
            api.notify.showSuccess(i18n('notify.publishRequest.created'));
            this.notifyIssueCreated(issue);
        }).catch((reason) => {
            this.unlockControls();
            this.close();
            if (reason && reason.message) {
                api.notify.showError(reason.message);
            }
        });
    }

    setContentToPublish(contents: ContentSummaryAndCompareStatus[]): RequestContentPublishDialog {
        return <RequestContentPublishDialog>super.setContentToPublish(contents);
    }

    setIncludeChildItems(include: boolean, silent?: boolean) {
        this.getItemList().getItemViews()
            .filter(itemView => itemView.getIncludeChildrenToggler())
            .forEach(itemView => itemView.getIncludeChildrenToggler().toggle(include, silent)
            );
        return this;
    }

    protected shouldCheckPublish(): boolean {
        return false;
    }

    protected updateSubTitle(itemsToPublish: number = this.countTotal()) {
        this.setSubTitle(i18n(`dialog.requestPublish.subname${this.getCurrentStep() + 1}`));

        if (itemsToPublish === 0) {
            this.setSubTitle(i18n('dialog.requestPublish.noItems'));
            return;
        }

        super.updateSubTitle(itemsToPublish);
    }

    protected updateControls(itemsToPublish: number = this.countTotal()) {
        super.updateControls(itemsToPublish);

        const canPublish = this.isCanPublish(itemsToPublish);
        const scheduleValid = this.isScheduleFormValid();
        const detailsValid = this.detailsFormView.isValid();

        this.toggleAction(canPublish && scheduleValid && detailsValid);
        this.nextAction.setEnabled(canPublish);
    }

    protected updateButtonCount(actionString: string, itemsToPublish: number) {
        const labelWithNumber: Function = (num, label) => `${label}${num > 1 ? ` (${num})` : ''}`;

        this.requestPublishAction.setLabel(labelWithNumber(itemsToPublish, i18n('action.createRequest')));
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
}

