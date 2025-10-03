import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {showError, showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {DropdownButtonRow} from '@enonic/lib-admin-ui/ui/dialog/DropdownButtonRow';
import {Fieldset} from '@enonic/lib-admin-ui/ui/form/Fieldset';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {FormItem, FormItemBuilder} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {PrincipalComboBox, PrincipalComboBoxWrapper} from '@enonic/lib-admin-ui/ui/security/PrincipalComboBox';
import {TextInput} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {ArrayHelper} from '@enonic/lib-admin-ui/util/ArrayHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import Q from 'q';
import {ContentPublishPromptEvent} from '../browse/ContentPublishPromptEvent';
import {ContentId} from '../content/ContentId';
import {BasePublishDialog} from '../dialog/BasePublishDialog';
import {DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {Issue} from '../issue/Issue';
import {IssueType} from '../issue/IssueType';
import {PublishRequest} from '../issue/PublishRequest';
import {PublishRequestItem} from '../issue/PublishRequestItem';
import {CreateIssueRequest} from '../issue/resource/CreateIssueRequest';
import {CSPrincipalCombobox} from '../security/CSPrincipalCombobox';

enum Step {
    ITEMS = 'items-step',
    DETAILS = 'details-step',
}
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

    private requestDetailsStep: DivEl;

    private publishItemsStep: DivEl;

    private prevAction: Action;

    private nextAction: Action;

    private detailsForm: Form;

    private detailsFormItem: FormItem;

    private assigneesFormItem: FormItem;

    private issueCreatedListeners: ((issue: Issue) => void)[] = [];

    protected constructor() {
        super({
            title: i18n('dialog.requestPublish'),
            dialogSubName: i18n('dialog.requestPublish.subname1'),
            class: 'request-publish-dialog',
            buttonRow: new DropdownButtonRow(),
            processingLabel: `${i18n('field.progress.publishing')}...`,
            processHandler: () => new ContentPublishPromptEvent({model: []}).fire(),
        } satisfies DependantItemsWithProgressDialogConfig);
    }

    public static get(): RequestContentPublishDialog {
        if (!RequestContentPublishDialog.INSTANCE) {
            RequestContentPublishDialog.INSTANCE = new RequestContentPublishDialog();
        }

        return RequestContentPublishDialog.INSTANCE;
    }

    protected initActions(): void {
        this.requestPublishAction = new Action(i18n('action.createRequest')).onExecuted(() => this.doRequestPublish());
        this.prevAction = new Action(i18n('action.previous')).onExecuted(() => this.goToStep(Step.ITEMS));
        this.nextAction = new Action(i18n('action.next')).onExecuted(() => this.goToStep(Step.DETAILS));
    }

    protected initElements(): void {
        this.initActions();

        super.initElements();

        this.actionButton = this.addAction(this.requestPublishAction);
        this.publishItemsStep = new DivEl('publish-items-step');
        this.requestDetailsStep = new DivEl('request-details-step');

        this.detailsFormItem = this.createDetailsFormItem();
        this.assigneesFormItem = this.createAssigneesFormItem();
        this.detailsForm = this.createForm();

        this.getButtonRow().makeActionMenu(this.nextAction);
    }

    private createForm(): Form {
        const detailsForm: Form = new Form(FormView.VALIDATION_CLASS);

        const fieldSet: Fieldset = new Fieldset();
        fieldSet.add(this.detailsFormItem);
        fieldSet.add(this.assigneesFormItem);
        detailsForm.add(fieldSet);

        return detailsForm;
    }

    protected postInitElements(): void {
        super.postInitElements();

        this.publishProcessor.setCheckPublishable(false);
    }

    protected initListeners(): void {
        super.initListeners();

        this.publishProcessor.onLoadingFailed(() => {
            this.setSubTitle(i18n('dialog.requestPublish.error.loadFailed'));
        });

        this.getDependantList().onSelectionChanged((original) => {
            this.nextAction.setEnabled(original);
        });

        (this.assigneesFormItem.getInput() as PrincipalComboBoxWrapper).getComboBox().onSelectionChanged(() => this.handleDataChanged());
        (this.detailsFormItem.getInput() as TextInput).onValueChanged(() => this.handleDataChanged());
    }

    private handleDataChanged(): void {
        this.detailsForm.addClass(FormView.VALIDATION_CLASS);
        this.detailsForm.validate(true);
        this.updateControls();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const issueIcon: DivEl = new DivEl('icon-publish-request opened');
            this.prependChildToHeader(issueIcon);

            this.appendChildToContentPanel(this.statusBar);

            this.detailsForm.addClass('details-form-view');

            this.publishItemsStep.appendChildren(this.getItemList(), this.getDependantsContainer());
            this.appendChildToContentPanel(this.publishItemsStep);

            this.requestDetailsStep.appendChildren<Element>(this.publishScheduleForm, this.detailsForm);
            this.appendChildToContentPanel(this.requestDetailsStep);

            this.addAction(this.prevAction).addClass('force-enabled prev');
            this.getButtonRow().getActionMenu().getActionButton().addClass('force-enabled next');

            return rendered;
        });
    }

    private createDetailsFormItem(): FormItem {
        return new FormItemBuilder(TextInput.middle('details-text-input'))
            .setLabel(i18n('dialog.requestPublish.changes'))
            .setValidator(Validators.required)
            .build();
    }

    private createAssigneesFormItem(): FormItem {
        const assigneesCombobox: PrincipalComboBox = new CSPrincipalCombobox({
            allowedTypes: [PrincipalType.USER],
            skipPrincipals: [PrincipalKey.ofAnonymous(), PrincipalKey.ofSU()],
        });

        return new FormItemBuilder(new PrincipalComboBoxWrapper(assigneesCombobox))
            .setLabel(i18n('dialog.requestPublish.assignees'))
            .build();
    }

    private goToStep(step: Step): void {
        const isDetailsStep = step === Step.DETAILS;

        for (const key in Step) {
            this.removeClass(Step[key]);
        }
        this.addClass(step);

        this.requestPublishAction.setVisible(isDetailsStep);
        this.publishItemsStep.setVisible(!isDetailsStep);
        this.requestDetailsStep.setVisible(isDetailsStep);
        this.prevAction.setVisible(isDetailsStep);
        this.getButtonRow().getActionMenu().setVisible(!isDetailsStep);

        this.setSubTitle(i18n(`dialog.requestPublish.subname${this.getCurrentStep() + 1}`));
        this.updateControls();

        if (isDetailsStep) {
            this.detailsFormItem.getInput().giveFocus();
        }
    }

    private getCurrentStep(): number {
        return this.detailsFormItem.isVisible() ? 1 : 0;
    }

    open(): void {
        this.publishScheduleForm.setFormVisible(false, true);   // form will be reset on hide as well
        this.publishProcessor.reloadPublishDependencies({resetDependantItems: true});

        (this.detailsFormItem.getInput() as TextInput).setValue('');
        (this.assigneesFormItem.getInput() as PrincipalComboBoxWrapper).getComboBox().setSelectedItems([]);
        this.detailsForm.removeClass(FormView.VALIDATION_CLASS);

        super.open();

        this.goToStep(Step.ITEMS);
    }

    private doRequestPublish(): void {
        this.lockControls();
        this.publishProcessor.setIgnoreDependantItemsChanged(true);

        this.createIssuesRequest().sendAndParse().then((issue: Issue) => {
            showSuccess(i18n('notify.publishRequest.created'));
            this.notifyIssueCreated(issue);
        }).catch((reason) => {
            this.handleErrorOnPublishRequest(reason);
        });
    }

    private handleErrorOnPublishRequest(reason): void {
        this.unlockControls();
        this.close();

        if (reason?.message) {
            showError(reason.message);
        }
    }

    private createIssuesRequest(): CreateIssueRequest {
        return new CreateIssueRequest()
            .setTitle(this.getDetailsText())
            .setType(IssueType.PUBLISH_REQUEST)
            .setApprovers(this.getApprovers())
            .setPublishRequest(this.createPublishRequest());
    }

    private getDetailsText(): string {
        return (this.detailsFormItem.getInput() as TextInput).getValue();
    }

    private getApprovers(): PrincipalKey[] {
        return (this.assigneesFormItem.getInput() as PrincipalComboBoxWrapper)
            .getComboBox()
            .getSelectedOptions()
            .map((option) => option.getOption().getDisplayValue().getKey());
    }

    private createPublishRequest(): PublishRequest {
        return PublishRequest.create()
            .addPublishRequestItems(this.getPublishRequestItems())
            .addExcludeIds(this.getExcludedIds())
            .build();
    }

    private getPublishRequestItems(): PublishRequestItem[] {
        const excludeChildrenIds: ContentId[] = this.getItemList().getExcludeChildrenIds();

        return this.getContentToPublishIds().map((id: ContentId) => {
            return PublishRequestItem.create()
                .setId(id)
                .setIncludeChildren(!ArrayHelper.contains(excludeChildrenIds, id))
                .build();
        });
    }

    setIncludeChildItems(include: boolean, silent?: boolean): RequestContentPublishDialog {
        this.getItemList().getItemViews()
            .filter((itemView) => itemView.hasChildrenItems())
            .forEach((itemView) => itemView.toggleIncludeChildren(include, silent));

        return this;
    }

    protected updateSubTitle(itemsToPublish: number = this.countTotal()): void {
        this.setSubTitle(i18n(`dialog.requestPublish.subname${this.getCurrentStep() + 1}`));

        if (itemsToPublish === 0) {
            this.setSubTitle(i18n('dialog.requestPublish.noItems'));
            return;
        }

        super.updateSubTitle();
    }

    protected updateControls(itemsToPublish: number = this.countTotal()): void {
        super.updateControls(itemsToPublish);

        const canPublish: boolean = this.publishProcessor.areAllConditionsSatisfied(itemsToPublish);
        const scheduleValid: boolean = this.isScheduleFormValid();
        const detailsValid: boolean = !this.detailsFormItem.getError() && !StringHelper.isBlank(this.getDetailsText());

        this.requestPublishAction.setEnabled(canPublish && scheduleValid && detailsValid);
        this.nextAction.setEnabled(canPublish);
    }

    protected updateButtonCount(actionString: string, itemsToPublish: number) {
        const labelWithNumber: (num: number, label: string) => string = (num, label) => `${label}${num > 1 ? ` (${num})` : ''}`;

        this.requestPublishAction.setLabel(labelWithNumber(itemsToPublish, i18n('action.createRequest')));
    }

    private notifyIssueCreated(issue: Issue): void {
        this.issueCreatedListeners.forEach(listener => listener(issue));
    }

    public onIssueCreated(listener: (issue: Issue) => void): void {
        this.issueCreatedListeners.push(listener);
    }

    public unIssueCreated(listener: (issue: Issue) => void): void {
        this.issueCreatedListeners = this.issueCreatedListeners.filter(curr => curr !== listener);
    }
}
