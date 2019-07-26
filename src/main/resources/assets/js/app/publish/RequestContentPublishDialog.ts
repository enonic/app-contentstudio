import {PublishDialogDependantList} from './PublishDialogDependantList';
import {ContentPublishPromptEvent} from '../browse/ContentPublishPromptEvent';
import {PublishDialogItemList} from './PublishDialogItemList';
import {CreateIssueDialog} from '../issue/view/CreateIssueDialog';
import {PublishProcessor} from './PublishProcessor';
import {IssueServerEventsHandler} from '../issue/event/IssueServerEventsHandler';
import {Issue} from '../issue/Issue';
import {ContentPublishDialogAction} from './ContentPublishDialogAction';
import {DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {HasUnpublishedChildrenRequest} from '../resource/HasUnpublishedChildrenRequest';
import {BasePublishDialog} from '../dialog/BasePublishDialog';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {CompareStatus} from '../content/CompareStatus';
import {PublishIssuesStateBar} from './PublishIssuesStateBar';
import {CreateIssueRequest} from '../issue/resource/CreateIssueRequest';
import {PublishRequest} from '../issue/PublishRequest';
import {PublishRequestItem} from '../issue/PublishRequestItem';
import {IssueDialogsManager} from '../issue/IssueDialogsManager';
import {IssueType} from '../issue/IssueType';
import {PublishScheduleForm} from './PublishScheduleForm';
import ContentId = api.content.ContentId;
import ListBox = api.ui.selector.list.ListBox;
import Action = api.ui.Action;
import Principal = api.security.Principal;
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

    private requestPublishAction: Action;

    private publishProcessor: PublishProcessor;

    private currentUser: Principal;

    private publishScheduleForm: PublishScheduleForm;

    private requestDetailsPropertySet: api.data.PropertySet;

    private publishIssuesStateBar: PublishIssuesStateBar;

    private requestDetailsStep: api.dom.DivEl;

    private publishItemsStep: api.dom.DivEl;

    private prevAction: api.ui.Action;

    private nextAction: api.ui.Action;

    private detailsFormView: api.form.FormView;

    constructor() {
        super(<DependantItemsWithProgressDialogConfig>{
                title: i18n('dialog.requestPublish'),
                dialogSubName: i18n('dialog.requestPublish.subname1'),
                class: 'request-publish-dialog',
                dependantsDescription: i18n('dialog.requestPublish.dependants'),
                processingLabel: `${i18n('field.progress.publishing')}...`,
                processHandler: () => {
                    new ContentPublishPromptEvent([]).fire();   //TODO ?
                }
            }
        );
    }

    protected initActions() {
        super.initActions();

        this.requestPublishAction = new ContentPublishDialogAction(() => {
            this.doPublish();
        }, i18n('action.createRequest'));

        this.prevAction = new api.ui.Action(i18n('action.previous'))
            .onExecuted((action: Action) => this.goToStep(0));

        this.nextAction = new api.ui.Action(i18n('action.next'))
            .onExecuted((action: Action) => this.goToStep(1));
    }

    protected initElements() {
        super.initElements();
        this.publishProcessor = new PublishProcessor(this.getItemList(), this.getDependantList());

        this.actionButton = this.addAction(this.requestPublishAction);

        this.requestDetailsPropertySet = new api.data.PropertySet();

        this.publishScheduleForm = new PublishScheduleForm(this.requestDetailsPropertySet);
        this.publishScheduleForm.layout(false);
        this.publishScheduleForm.onFormVisibilityChanged((visible) => {
            this.updateControls();

        });
        const detailsForm = this.createDetailsForm();

        this.publishIssuesStateBar = new PublishIssuesStateBar();
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

        this.loadCurrentUser();
    }

    protected postInitElements() {
        super.postInitElements();

        this.addClickIgnoredElement(CreateIssueDialog.get());

        this.lockControls();
    }

    protected initListeners() {
        super.initListeners();

        this.publishProcessor.onLoadingStarted(this.handleLoadStarted.bind(this));
        this.publishProcessor.onLoadingFinished(this.handleLoadFinished.bind(this));
        this.publishProcessor.onLoadingFailed(this.handleLoadFailed.bind(this));

        this.handleIssueGlobalEvents();
    }

    private handleLoadStarted() {
        this.lockControls();
        this.showLoadMask();
        this.setSubTitle(i18n('dialog.publish.resolving'));
        this.publishIssuesStateBar.reset();
    }

    private handleLoadFinished() {
        const header: string = this.getDependantsHeader(this.getDependantList().isVisible());
        this.updateDependantsHeader(header);
        this.updateChildItemsToggler();

        if (this.publishProcessor.containsInvalidDependants() || !this.isAllPublishable()) {
            this.setDependantListVisible(true);
        }

        this.hideLoadMask();
        this.updateShowScheduleDialogButton();

        const itemsToPublish: number = this.countTotal();
        this.updateSubTitle(itemsToPublish);
        this.updateButtonCount(null, itemsToPublish);
        this.updateControls(itemsToPublish);
    }

    private updateChildItemsToggler() {
        const ids: ContentId[] = this.getContentToPublishIds();

        new HasUnpublishedChildrenRequest(ids).sendAndParse().then((children) => {
            const toggleable = children.getResult().some(requestedResult => requestedResult.getHasChildren());
            this.getItemList().setContainsToggleable(toggleable);

            children.getResult().forEach((requestedResult) => {
                const item = this.getItemList().getItemViewById(requestedResult.getId());

                if (item) {
                    item.setTogglerActive(requestedResult.getHasChildren());
                }
            });
        });
    }

    private handleLoadFailed() {
        this.setSubTitle(i18n('dialog.requestPublish.error.loadFailed'));
        this.publishIssuesStateBar.showLoadFailed();
        this.updateControls();
        this.hideLoadMask();
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
    }

    private getCurrentStep(): number {
        return this.detailsFormView.isVisible() ? 1 : 0;
    }

    private loadCurrentUser() {
        return new api.security.auth.IsAuthenticatedRequest().sendAndParse().then((loginResult) => {
            this.currentUser = loginResult.getUser();
        });
    }

    private handleIssueGlobalEvents() {

        IssueServerEventsHandler.getInstance().onIssueCreated((issues: Issue[]) => {
            if (this.isVisible()) {
                if (issues.some((issue) => this.isIssueCreatedByCurrentUser(issue))) {
                    this.close();
                }
            }
        });
    }

    isIssueCreatedByCurrentUser(issue: Issue): boolean {
        if (!issue.getCreator()) {
            return false;
        }

        return issue.getCreator() === this.currentUser.getKey().toString();
    }

    protected createDependantList(): PublishDialogDependantList {
        return new PublishDialogDependantList();
    }

    protected getDependantList(): PublishDialogDependantList {
        return <PublishDialogDependantList>super.getDependantList();
    }

    open() {
        this.publishProcessor.resetExcludedIds();
        this.publishProcessor.setIgnoreDependantItemsChanged(false);

        CreateIssueDialog.get().reset();

        this.publishScheduleForm.setFormVisible(false, true);   // this.requestDetailsPropertySet will be reset here
        this.detailsFormView.update(this.requestDetailsPropertySet, false);     // all we need is to update second form data
        this.goToStep(0);

        this.reloadPublishDependencies();

        super.open();
    }

    close() {
        super.close();
        this.getItemList().clearExcludeChildrenIds();

        CreateIssueDialog.get().reset();
    }

    protected countTotal(): number {
        return this.publishProcessor.countTotal();
    }

    protected getDependantIds(): ContentId[] {
        return this.publishProcessor.getDependantIds();
    }

    protected setIgnoreItemsChanged(value: boolean) {
        super.setIgnoreItemsChanged(value);
        this.publishProcessor.setIgnoreItemsChanged(value);
    }

    public getContentToPublishIds(): ContentId[] {
        return this.publishProcessor.getContentToPublishIds();
    }

    public getExcludedIds(): ContentId[] {
        return this.publishProcessor.getExcludedIds();
    }

    public isAllPublishable(): boolean {
        return this.publishProcessor && this.publishProcessor.isAllPublishable();
    }

    private reloadPublishDependencies() {
        if (this.isProgressBarEnabled()) {
            return;
        }

        this.publishProcessor.reloadPublishDependencies(true);
    }

    private doPublish() {

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

        const publishSet = this.requestDetailsPropertySet.getPropertySet('publish');
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
            IssueDialogsManager.get().openDetailsDialog(issue);
        }).catch((reason) => {
            this.unlockControls();
            this.close();
            if (reason && reason.message) {
                api.notify.showError(reason.message);
            }
        });
    }

    setDependantItems(items: ContentSummaryAndCompareStatus[]) {
        if (this.isProgressBarEnabled()) {
            return;
        }
        super.setDependantItems(items);
    }

    setContentToPublish(contents: ContentSummaryAndCompareStatus[]) {
        if (this.isProgressBarEnabled()) {
            return this;
        }
        this.setIgnoreItemsChanged(true);
        this.setListItems(contents);
        this.setIgnoreItemsChanged(false);
        return this;
    }

    setIncludeChildItems(include: boolean, silent?: boolean) {
        this.getItemList().getItemViews()
            .filter(itemView => itemView.getIncludeChildrenToggler())
            .forEach(itemView => itemView.getIncludeChildrenToggler().toggle(include, silent)
            );
        return this;
    }

    protected createItemList(): ListBox<ContentSummaryAndCompareStatus> {
        return new PublishDialogItemList();
    }

    protected getItemList(): PublishDialogItemList {
        return <PublishDialogItemList>super.getItemList();
    }

    private updateSubTitle(itemsToPublish: number) {
        this.setSubTitle(i18n(`dialog.requestPublish.subname${this.getCurrentStep() + 1}`));

        if (itemsToPublish === 0) {
            this.setSubTitle(i18n('dialog.requestPublish.noItems'));
            return;
        }

        const allValid: boolean = this.areItemsAndDependantsValid();
        const containsItemsInProgress: boolean = this.containsItemsInProgress();
        const allPublishable: boolean = this.isAllPublishable();

        if (allPublishable && allValid && !containsItemsInProgress) {
            this.publishIssuesStateBar.removeClass('has-issues');
            return;
        }

        this.publishIssuesStateBar.addClass('has-issues');
        if (containsItemsInProgress) {
            this.publishIssuesStateBar.showContainsInProgress();
        }

        if (!allValid) {
            this.publishIssuesStateBar.showContainsInvalid();
        }

        if (!allPublishable) {
            this.publishIssuesStateBar.showContainsNotPublishable();
        }
    }

    private updateControls(itemsToPublish: number = this.countTotal()) {
        const allValid: boolean = this.areItemsAndDependantsValid();
        const allPublishable: boolean = this.isAllPublishable();
        const canPublish: boolean = itemsToPublish > 0 && allValid && allPublishable;
        const scheduleValid = !this.publishScheduleForm.isFormVisible() || this.publishScheduleForm.isFormValid();
        const detailsValid = this.detailsFormView.isValid();

        this.toggleAction(canPublish && scheduleValid && detailsValid);

        this.getButtonRow().focusDefaultAction();
        this.updateTabbable();
    }


    protected updateButtonCount(actionString: string, itemsToPublish: number) {
        const labelWithNumber: Function = (num, label) => `${label}${num > 1 ? ` (${num})` : ''}`;

        this.requestPublishAction.setLabel(labelWithNumber(itemsToPublish, i18n('action.createRequest')));
    }

    protected isScheduleButtonAllowed(): boolean {
        return this.isAllPublishable() && this.areSomeItemsOffline();
    }

    private areSomeItemsOffline(): boolean {
        let summaries: ContentSummaryAndCompareStatus[] = this.getItemList().getItems();
        return summaries.some((summary) => summary.getCompareStatus() === CompareStatus.NEW);
    }

    private areItemsAndDependantsValid(): boolean {
        return !this.publishProcessor.containsInvalidItems();
    }

    private containsItemsInProgress(): boolean {
        return this.publishProcessor.containsItemsInProgress();
    }
}

