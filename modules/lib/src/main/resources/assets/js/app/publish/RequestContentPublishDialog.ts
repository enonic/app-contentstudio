import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {showError, showSuccess} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentPublishPromptEvent} from '../browse/ContentPublishPromptEvent';
import {Issue} from '../issue/Issue';
import {DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {BasePublishDialog, PublishDialogButtonRow} from '../dialog/BasePublishDialog';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {CreateIssueRequest} from '../issue/resource/CreateIssueRequest';
import {PublishRequest} from '../issue/PublishRequest';
import {PublishRequestItem} from '../issue/PublishRequestItem';
import {IssueType} from '../issue/IssueType';
import {Action} from 'lib-admin-ui/ui/Action';
import {PropertyEvent} from 'lib-admin-ui/data/PropertyEvent';
import {TextLine} from 'lib-admin-ui/form/inputtype/text/TextLine';
import {PrincipalSelector} from 'lib-admin-ui/form/inputtype/principal/PrincipalSelector';
import {ArrayHelper} from 'lib-admin-ui/util/ArrayHelper';
import {PrincipalType} from 'lib-admin-ui/security/PrincipalType';
import {PropertySet} from 'lib-admin-ui/data/PropertySet';
import {FormView} from 'lib-admin-ui/form/FormView';
import {FormContext} from 'lib-admin-ui/form/FormContext';
import {Form, FormBuilder} from 'lib-admin-ui/form/Form';
import {InputBuilder} from 'lib-admin-ui/form/Input';
import {OccurrencesBuilder} from 'lib-admin-ui/form/Occurrences';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {MenuButton} from 'lib-admin-ui/ui/button/MenuButton';

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

    private requestDetailsPropertySet: PropertySet;

    private requestDetailsStep: DivEl;

    private publishItemsStep: DivEl;

    private prevAction: Action;

    private nextAction: Action;

    private detailsFormView: FormView;

    private issueCreatedListeners: { (issue: Issue): void }[] = [];

    protected constructor() {
        super(<DependantItemsWithProgressDialogConfig>{
            title: i18n('dialog.requestPublish'),
            dialogSubName: i18n('dialog.requestPublish.subname1'),
            class: 'request-publish-dialog grey-header',
            buttonRow: new PublishDialogButtonRow(),
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

        this.requestPublishAction = new Action(i18n('action.createRequest')).onExecuted(() => this.doRequestPublish());
        this.prevAction = new Action(i18n('action.previous')).onExecuted(() => this.goToStep(0));
        this.nextAction = new Action(i18n('action.next')).onExecuted(() => this.goToStep(1));
    }

    protected initElements() {
        super.initElements();

        this.publishProcessor.setCheckPublishable(false);

        this.actionButton = this.addAction(this.requestPublishAction);

        this.requestDetailsPropertySet = new PropertySet();

        this.publishScheduleForm.layout(false);

        const detailsForm = this.createDetailsForm();

        this.publishItemsStep = new DivEl('publish-items-step');
        this.requestDetailsStep = new DivEl('request-details-step');

        this.detailsFormView = new FormView(FormContext.create().build(), detailsForm, this.requestDetailsPropertySet);
        this.detailsFormView.displayValidationErrors(false);
        this.detailsFormView.layout(false);

        this.requestDetailsPropertySet.onChanged((event: PropertyEvent) => {
            this.detailsFormView.validate(false, true);
            this.detailsFormView.displayValidationErrors(!this.detailsFormView.getData().isEmpty());

            this.updateControls();
        });

        this.getButtonRow().makeActionMenu(this.nextAction, [this.markAllAsReadyAction]);
    }

    protected initListeners() {
        super.initListeners();

        this.publishProcessor.onLoadingFailed(() => {
            this.setSubTitle(i18n('dialog.requestPublish.error.loadFailed'));
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const issueIcon = new DivEl('icon-publish-request opened');
            this.prependChildToHeader(issueIcon);

            this.appendChildToContentPanel(this.publishIssuesStateBar);

            this.publishItemsStep.appendChildren(this.getItemList(), this.getDependantsContainer());
            this.appendChildToContentPanel(this.publishItemsStep);

            this.requestDetailsStep.appendChildren<Element>(this.publishScheduleForm, this.detailsFormView);
            this.appendChildToContentPanel(this.requestDetailsStep);

            this.addAction(this.prevAction).addClass('force-enabled prev');
            this.getButtonRow().getActionMenu().getActionButton().addClass('force-enabled next');

            return rendered;
        });
    }

    private createDetailsForm(): Form {
        const changes = new InputBuilder()
            .setName('changes')
            .setLabel(i18n('dialog.requestPublish.changes'))
            .setInputType(TextLine.getName())
            .setOccurrences(new OccurrencesBuilder().setMinimum(1).setMaximum(1).build())
            .setMaximizeUIInputWidth(true)
            .build();

        const assignees = new InputBuilder()
            .setName('assignees')
            .setLabel(i18n('dialog.requestPublish.assignees'))
            .setInputType(PrincipalSelector.getName())
            .setOccurrences(new OccurrencesBuilder().setMinimum(0).setMaximum(0).build())
            .setMaximizeUIInputWidth(true)
            .setInputTypeConfig({
                principalType: PrincipalType[PrincipalType.USER],
                skipPrincipals: [PrincipalKey.ofAnonymous(), PrincipalKey.ofSU()]
            })
            .build();

        return new FormBuilder().addFormItem(changes).addFormItem(assignees).build();
    }

    private goToStep(num: number) {
        this.requestPublishAction.setVisible(num === 1);
        this.publishItemsStep.setVisible(num === 0);
        this.requestDetailsStep.setVisible(num === 1);
        this.prevAction.setVisible(num === 1);
        this.getButtonRow().getActionMenu().setVisible(num === 0);
        this.setSubTitle(i18n(`dialog.requestPublish.subname${this.getCurrentStep() + 1}`));
        this.updateControls();
        if (num === 1) {
            this.detailsFormView.giveFocus();
        }
    }

    private getCurrentStep(): number {
        return this.detailsFormView.isVisible() ? 1 : 0;
    }

    open() {
        this.publishScheduleForm.setFormVisible(false, true);   // form will be reset on hide as well
        this.publishProcessor.reloadPublishDependencies(true);
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

        const changes = this.requestDetailsPropertySet.getString('changes');
        const assignees = this.requestDetailsPropertySet.getPropertyArray('assignees');

        const createIssueRequest = new CreateIssueRequest()
            .setTitle(changes)
            .setType(IssueType.PUBLISH_REQUEST)
            .setApprovers(assignees ? assignees.map((prop) => {
                return PrincipalKey.fromString(prop.getReference().getNodeId());
            }) : undefined)
            .setPublishRequest(publishRequest);

        createIssueRequest.sendAndParse().then((issue: Issue) => {
            showSuccess(i18n('notify.publishRequest.created'));
            this.notifyIssueCreated(issue);
        }).catch((reason) => {
            this.unlockControls();
            this.close();
            if (reason && reason.message) {
                showError(reason.message);
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

        const canPublish = this.publishProcessor.areAllConditionsSatisfied(itemsToPublish);
        const scheduleValid = this.isScheduleFormValid();
        const detailsValid = this.detailsFormView.validate().isValid();

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

