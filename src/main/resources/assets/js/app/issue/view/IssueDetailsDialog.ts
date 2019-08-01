import {Issue} from '../Issue';
import {ContentPublishPromptEvent} from '../../browse/ContentPublishPromptEvent';
import {Router} from '../../Router';
import {PublishDialogItemList} from '../../publish/PublishDialogItemList';
import {ContentPublishDialogAction} from '../../publish/ContentPublishDialogAction';
import {PublishDialogDependantList} from '../../publish/PublishDialogDependantList';
import {UpdateIssueRequest} from '../resource/UpdateIssueRequest';
import {IssueStatus, IssueStatusFormatter} from '../IssueStatus';
import {IssueServerEventsHandler} from '../event/IssueServerEventsHandler';
import {PublishRequest} from '../PublishRequest';
import {PublishRequestItem} from '../PublishRequestItem';
import {IssueDetailsDialogButtonRow} from './IssueDetailsDialogDropdownButtonRow';
import {DetailsDialogSubTitle} from './IssueDetailsDialogSubTitle';
import {PublishProcessor} from '../../publish/PublishProcessor';
import {DependantItemsWithProgressDialog, DependantItemsWithProgressDialogConfig} from '../../dialog/DependantItemsWithProgressDialog';
import {IssueCommentsList} from './IssueCommentsList';
import {IssueCommentTextArea} from './IssueCommentTextArea';
import {CreateIssueCommentRequest} from '../resource/CreateIssueCommentRequest';
import {IssueDetailsDialogHeader} from './IssueDetailsDialogHeader';
import {PublishContentRequest} from '../../resource/PublishContentRequest';
import {ContentComboBox} from '../../inputtype/ui/selector/ContentComboBox';
import {ContentSummaryAndCompareStatusFetcher} from '../../resource/ContentSummaryAndCompareStatusFetcher';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {IssueType} from '../IssueType';
import {PublishScheduleForm} from '../../publish/PublishScheduleForm';
import AEl = api.dom.AEl;
import DialogButton = api.ui.dialog.DialogButton;
import TaskState = api.task.TaskState;
import ListBox = api.ui.selector.list.ListBox;
import Action = api.ui.Action;
import Principal = api.security.Principal;
import i18n = api.util.i18n;
import Tooltip = api.ui.Tooltip;
import NavigatedDeckPanel = api.ui.panel.NavigatedDeckPanel;
import TabBar = api.ui.tab.TabBar;
import TabBarItemBuilder = api.ui.tab.TabBarItemBuilder;
import Panel = api.ui.panel.Panel;
import AppHelper = api.util.AppHelper;
import TabBarItem = api.ui.tab.TabBarItem;
import PrincipalComboBoxBuilder = api.ui.security.PrincipalComboBoxBuilder;
import PrincipalType = api.security.PrincipalType;
import PrincipalKey = api.security.PrincipalKey;
import PrincipalLoader = api.security.PrincipalLoader;
import ComboBox = api.ui.selector.combobox.ComboBox;
import ContentId = api.content.ContentId;
import PropertySet = api.data.PropertySet;

export class IssueDetailsDialog
    extends DependantItemsWithProgressDialog {

    private issue: Issue;

    private currentUser: Principal;

    private errorTooltip: Tooltip;

    private static INSTANCE: IssueDetailsDialog;

    private itemsTab: TabBarItem;

    private commentsTab: TabBarItem;

    private assigneesTab: TabBarItem;

    private tabPanel: api.ui.panel.NavigatedDeckPanel;

    private closeAction: api.ui.Action;

    private reopenAction: api.ui.Action;

    private commentAction: api.ui.Action;

    private detailsSubTitle: DetailsDialogSubTitle;

    private publishAction: ContentPublishDialogAction;

    private backButton: AEl;

    private assigneesPanel: Panel;

    private commentsPanel: Panel;

    private itemsPanel: Panel;

    private tabBar: TabBar;

    private itemSelector: ContentComboBox<ContentTreeSelectorItem>;

    private publishProcessor: PublishProcessor;

    private saveOnLoaded: boolean;

    private skipNextServerUpdatedEvent: boolean;

    private ignoreNextExcludeChildrenEvent: boolean;

    private debouncedUpdateIssue: Function;

    private commentsList: IssueCommentsList;

    private commentTextArea: IssueCommentTextArea;

    private assigneesCombobox: api.ui.security.PrincipalComboBox;

    private scheduleAction: api.ui.Action;

    private publishScheduleForm: PublishScheduleForm;

    private scheduleFormPropertySet: api.data.PropertySet;

    private updatedListeners: { (issue: Issue): void }[] = [];

    protected constructor() {
        super(<DependantItemsWithProgressDialogConfig>{
            title: i18n('dialog.issue'),
            class: 'issue-dialog issue-details-dialog grey-header',
                dialogSubName: i18n('dialog.issue.resolving'),
                processingLabel: `${i18n('field.progress.publishing')}...`,
                buttonRow: new IssueDetailsDialogButtonRow(),
                processHandler: () => {
                    new ContentPublishPromptEvent([]).fire();
                },
            }
        );
    }

    public static get(): IssueDetailsDialog {
        if (!IssueDetailsDialog.INSTANCE) {
            IssueDetailsDialog.INSTANCE = new IssueDetailsDialog();
        }

        return IssueDetailsDialog.INSTANCE;
    }

    protected initElements() {
        super.initElements();

        this.initActions();

        this.publishProcessor = new PublishProcessor(this.getItemList(), this.getDependantList());
        this.commentTextArea = new IssueCommentTextArea();
        this.detailsSubTitle = new DetailsDialogSubTitle(this.issue);
        this.loadCurrentUser().done(currentUser => {
            this.commentTextArea.setUser(currentUser);
            this.detailsSubTitle.setUser(currentUser);
        });

        this.scheduleFormPropertySet = new api.data.PropertySet();
        this.publishScheduleForm = new PublishScheduleForm(this.scheduleFormPropertySet);
        this.publishScheduleForm.layout(false);
        this.scheduleFormPropertySet.onChanged(() => {
            if (this.isRendered()) {
                this.updateItemsCountAndButtonLabels();
            }
        });
        this.publishScheduleForm.onFormVisibilityChanged((visible) => {
            if (this.isRendered()) {
                this.updateItemsCountAndButtonLabels();
            }
            this.toggleClass('with-schedule-form', visible);
        });

        this.backButton = new AEl('back-button');
        this.header.addClass('with-back-button');
        this.initTabs();
        this.itemSelector = ContentComboBox.create()
            .setShowStatus(true)
            .setHideComboBoxWhenMaxReached(false)
            .build();
        this.tabBar = new TabBar();
        this.tabPanel = new NavigatedDeckPanel(this.tabBar);

        this.actionButton = this.createPublishButton();
        this.createScheduleButton();

        this.errorTooltip = new Tooltip(this.actionButton, i18n('dialog.publish.invalidError'), 500);
    }

    protected initTabs() {
        const userLoader = new PrincipalLoader().setAllowedTypes([PrincipalType.USER]).skipPrincipals(
            [PrincipalKey.ofAnonymous(), PrincipalKey.ofSU()]);
        this.assigneesCombobox = new PrincipalComboBoxBuilder().setLoader(userLoader).build();
        this.commentsList = new IssueCommentsList();

        this.assigneesTab = IssueDetailsDialog.createTabBar('assignees');
        this.commentsTab = IssueDetailsDialog.createTabBar('comments');
        this.itemsTab = IssueDetailsDialog.createTabBar('items');

        this.assigneesPanel = new Panel();
        this.commentsPanel = new Panel();
        this.itemsPanel = new Panel();
    }

    private static createTabBar(name: string): TabBarItem {
        const tab = new TabBarItemBuilder().setLabel(i18n(`field.${name}`)).build();
        tab.addClass(`${name}-tab`);
        return tab;
    }

    protected postInitElements() {
        super.postInitElements();

        this.addClickIgnoredElement(this.commentsList.getContextMenu());
        this.addClickIgnoredElement(this.commentsList.getConfirmDialog());

        this.commentAction.setEnabled(false);
        this.errorTooltip.setActive(false);
        this.backButton.setTitle(i18n('dialog.issue.back'));
    }

    protected initListeners() {
        super.initListeners();

        this.debouncedUpdateIssue = AppHelper.debounce(this.doUpdateIssue.bind(this), 1000);

        this.commentTextArea.onValueChanged(event => {
            const saveAllowed = event.getNewValue().trim().length > 0;
            this.commentAction.setEnabled(saveAllowed);
            this.updateCloseButtonLabel(saveAllowed);
        });

        this.commentTextArea.onKeyDown(event => {
            event.stopImmediatePropagation();
            const value = this.commentTextArea.getValue();
            const saveAllowed = value.length > 0;
            switch (event.keyCode) {
            case 27:
                this.commentTextArea.setValue('').giveBlur();
                break;
            case 13:
                // ctrl/cmd + enter
                if (saveAllowed && (event.ctrlKey || event.metaKey)) {
                    this.saveComment(value, this.commentAction);
                }
                break;
            }
        });

        this.detailsSubTitle.onIssueStatusChanged((event) => {
            const newStatus = IssueStatusFormatter.fromString(event.getNewValue());
            this.debouncedUpdateIssue(newStatus);
        });

        this.backButton.onClicked(() => this.close());

        const updateTabCount = (save) => {
            let count = 0;
            const loader = this.assigneesCombobox.getLoader();
            if (loader.isPreLoaded() || loader.isLoaded()) {
                count = this.assigneesCombobox.getSelectedValues().length;
            }
            this.updateTabLabel(2, i18n('field.assignees'), count);
            if (save) {
                this.debouncedUpdateIssue(this.issue.getIssueStatus(), true);
            }
        };

        this.assigneesCombobox.onValueLoaded(() => updateTabCount(false));
        this.assigneesCombobox.onOptionSelected(() => updateTabCount(true));
        this.assigneesCombobox.onOptionDeselected(() => updateTabCount(true));

        const updateCommentsCount = () => {
            const count = this.commentsList.getItemCount();
            this.updateTabLabel(0, i18n('field.comments'), count);
        };

        this.commentsList.onItemsAdded(updateCommentsCount);
        this.commentsList.onItemsRemoved(updateCommentsCount);
        this.commentsList.onEditModeChanged(editMode => {
            this.commentTextArea.setReadOnly(editMode);
            (<IssueDetailsDialogHeader>this.header).setReadOnly(editMode);
            this.setActionsEnabled(!editMode);
        });

        this.itemSelector.onOptionSelected(option => {
            this.saveOnLoaded = true;
            const ids = [option.getSelectedOption().getOption().displayValue.getContentId()];
            ContentSummaryAndCompareStatusFetcher.fetchByIds(ids).then(result => {
                this.addListItems(result);
            });
        });

        this.itemSelector.onOptionDeselected(option => {
            this.saveOnLoaded = true;
            const id = option.getSelectedOption().getOption().displayValue.getContentId();
            const items = [this.getItemList().getItem(id.toString())];
            this.removeListItems(items);
            this.getItemList().refreshList();
        });

        this.tabPanel.onPanelShown(event => {
            const isAssignees = event.getPanel() === this.assigneesPanel;
            const isComments = event.getPanel() === this.commentsPanel;
            this.toggleClass('tab-assignees', isAssignees);
            this.toggleClass('tab-comments', isComments);
            this.toggleClass('tab-items', !isAssignees && !isComments);
            const hasComment = isComments && !api.util.StringHelper.isEmpty(this.commentTextArea.getValue());
            this.updateCloseButtonLabel(hasComment);
        });

        this.closeAction.onExecuted(action => {
            const comment = this.commentTextArea.getValue();
            const hasComment = !api.util.StringHelper.isEmpty(comment);
            if (hasComment) {
                action.setEnabled(false);
                this.saveComment(comment, this.commentAction).then(() => {
                    this.detailsSubTitle.setStatus(IssueStatus.CLOSED);
                }).catch(api.DefaultErrorHandler.handle).finally(() => {
                    action.setEnabled(true);
                });
            } else {
                this.detailsSubTitle.setStatus(IssueStatus.CLOSED);
            }
        });

        this.reopenAction.onExecuted(() => {
            this.detailsSubTitle.setStatus(IssueStatus.OPEN);
        });

        this.commentAction.onExecuted(action => {
            const comment = this.commentTextArea.getValue();
            this.saveComment(comment, action);
        });

        this.initElementListeners();

        this.handleIssueGlobalEvents();
    }

    private updateCloseButtonLabel(canComment: boolean) {
        const label = this.getCloseButtonLabel(canComment);
        this.closeAction.setLabel(label);
    }

    private updateTabLabel(tabIndex: number, label: string, count: number) {
        this.tabBar.getNavigationItem(tabIndex).setLabel(IssueDetailsDialog.makeLabelWithCounter(label, count));
    }

    private static makeLabelWithCounter(label: string, count: number = 0): string {
        return (count > 0 ? `${label} (${count})` : label);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const isPublishRequest = this.isPublishRequestViewed();

            this.setSubTitleEl(this.detailsSubTitle);
            this.prependChildToHeader(this.backButton);
            this.createAddCommentButton();
            this.createReopenButton();
            this.createCloseButton();
            this.createNoActionMessage();
            this.assigneesPanel.appendChild(this.assigneesCombobox);

            this.commentsPanel.appendChild(this.commentsList);

            const itemList = this.getItemList();
            itemList.setCanBeEmpty(!isPublishRequest);
            this.itemsPanel.appendChildren<api.dom.DivEl>(this.publishScheduleForm, this.itemSelector, itemList,
                this.getDependantsContainer());

            this.tabPanel.addNavigablePanel(this.commentsTab, this.commentsPanel, !isPublishRequest);
            this.tabPanel.addNavigablePanel(this.itemsTab, this.itemsPanel, isPublishRequest);
            this.tabPanel.addNavigablePanel(this.assigneesTab, this.assigneesPanel);

            this.appendChildToHeader(this.tabBar);
            this.appendChildToContentPanel(this.tabPanel);
            this.prependChildToFooter(this.commentTextArea);

            this.updateItemsCountAndButtonLabels();

            if (this.issue) {
                this.setIssue(this.issue);
            }

            return rendered;
        });
    }

    private isPublishRequestViewed(): boolean {
        return !!this.issue && this.issue.getType() === IssueType.PUBLISH_REQUEST;
    }

    private getItemsTabLabel(): string {
        return this.isPublishRequestViewed() ? i18n('field.issue.publishRequests') : i18n('field.items');
    }

    private getCloseButtonLabel(canComment?: boolean): string {
        const isPublishRequest = this.isPublishRequestViewed();
        if (isPublishRequest) {
            return canComment ? i18n('action.commentAndCloseRequest') : i18n('action.closeRequest');
        } else {
            return canComment ? i18n('action.commentAndCloseIssue') : i18n('action.closeIssue');
        }
    }

    private getReopenButtonLabel(): string {
        return this.isPublishRequestViewed() ? i18n('action.reopenRequest') : i18n('action.reopenIssue');
    }

    private getPublishButtonLabel(itemsCount: number = 0): string {
        const isPublishRequestViewed = this.isPublishRequestViewed();

        if (isPublishRequestViewed) {
            return IssueDetailsDialog.makeLabelWithCounter(i18n('action.publishNow'), itemsCount);
        } else {
            return i18n('action.publishMore');
        }
    }

    private updateItemsCountAndButtonLabels() {
        const count: number = this.countTotal();

        this.updateItemsCount();
        this.updateControls(count);
        this.actionButton.setLabel(this.getPublishButtonLabel(count));
        this.scheduleAction.setLabel(IssueDetailsDialog.makeLabelWithCounter(i18n('action.schedule'), count));
    }


    protected lockControls() {
        super.lockControls();
        this.scheduleAction.setEnabled(false);
    }

    protected unlockControls() {
        super.unlockControls();
        this.scheduleAction.setEnabled(true);
    }

    private updateItemsCount() {
        const count: number = this.countTotal();
        const label = this.getItemsTabLabel();
        this.updateTabLabel(1, label, count);
    }

    protected toggleAction(enable: boolean) {
        this.toggleControls(enable);
        this.toggleClass('no-action', !enable);
    }

    private isCanPublish(itemsCount: number = this.countTotal()): boolean {
        const allValid: boolean = this.areItemsAndDependantsValid();
        const allPublishable: boolean = this.isAllPublishable();
        const containsItemsInProgress: boolean = this.containsItemsInProgress();
        const canPublish: boolean = itemsCount > 0 && allValid && allPublishable && !containsItemsInProgress;
        const scheduleValid = !this.publishScheduleForm.isFormVisible() || this.publishScheduleForm.isFormValid();
        return canPublish && scheduleValid;
    }

    private updateControls(itemsToPublish: number = this.countTotal()) {
        this.toggleAction(itemsToPublish > 0);

        const isIssue = !this.isPublishRequestViewed();

        const canPublish = this.isCanPublish(itemsToPublish);
        this.publishAction.setEnabled(isIssue || canPublish);
        this.scheduleAction.setEnabled(canPublish);

        this.errorTooltip.setActive(this.publishProcessor.containsInvalidItems());

        this.getButtonRow().focusDefaultAction();
        this.updateTabbable();
    }


    public isAllPublishable(): boolean {
        return this.publishProcessor && this.publishProcessor.isAllPublishable();
    }

    private areItemsAndDependantsValid(): boolean {
        return !this.publishProcessor.containsInvalidItems();
    }

    private containsItemsInProgress(): boolean {
        return this.publishProcessor.containsItemsInProgress();
    }

    private setActionsEnabled(flag: boolean) {
        this.getButtonRow().getActions().forEach(action => {
            if (action === this.commentAction) {
                action.setEnabled(flag && this.commentTextArea.getValue().length > 0);
            } else {
                action.setEnabled(flag);
            }
        });
        this.closeAction.setEnabled(flag);
    }

    open() {
        super.open();
        if (this.isRendered()) {
            this.tabPanel.selectPanelByIndex(this.isPublishRequestViewed() ? 1 : 0);
        }

        Router.setHash('issue/' + this.issue.getId());
    }

    public reloadItemList() {
        ContentSummaryAndCompareStatusFetcher.fetchByIds(this.getItemList().getItemsIds()).then(items => {
            this.getItemList().replaceItems(items);
            this.getItemList().refreshList();

            this.initItemListTogglers(this.getItemList());

            this.updateItemsCountAndButtonLabels();
        });
    }

    private initElementListeners() {
        const handleRemoveItemClicked = (item) => {
            this.saveOnLoaded = true;

            const combo = this.itemSelector.getComboBox();
            const option = combo.getOptionByValue(item.getContentId().toString());
            if (option) {
                // option may not be loaded yet
                combo.deselectOption(option, true);
            }
        };
        const itemList = this.getItemList();
        itemList.onItemsAdded(() => {
            this.ignoreNextExcludeChildrenEvent = this.initItemListTogglers(itemList);
            this.updateItemsCountAndButtonLabels();
        });
        itemList.onItemsRemoved(() => {
            this.updateItemsCountAndButtonLabels();
        });
        itemList.onItemRemoveClicked(handleRemoveItemClicked);
        itemList.onChildrenListChanged(() => {
            if (!this.ignoreNextExcludeChildrenEvent) {
                // save if toggle was updated manually only
                this.saveOnLoaded = true;
            }
            this.ignoreNextExcludeChildrenEvent = false;
        });

        itemList.onListItemsDataChanged(this.reloadItemList.bind(this));

        this.getDependantList().onItemRemoveClicked(handleRemoveItemClicked);

        this.publishProcessor.onLoadingStarted(() => {
            this.lockControls();
        });

        this.publishProcessor.onLoadingFinished(() => {
            this.updateItemsCountAndButtonLabels();
            if (this.saveOnLoaded) {
                this.debouncedUpdateIssue(this.issue.getIssueStatus(), true);
                this.saveOnLoaded = false;
            }

            if (this.publishProcessor.containsInvalidDependants()) {
                this.setDependantListVisible(true);
            }
        });
    }

    protected getDependantIds(): ContentId[] {
        return this.publishProcessor.getDependantIds();
    }

    private loadCurrentUser(): wemQ.Promise<Principal> {
        return new api.security.auth.IsAuthenticatedRequest().sendAndParse().then((loginResult) => {
            this.currentUser = loginResult.getUser();
            return this.currentUser;
        });
    }

    private handleIssueGlobalEvents() {
        const updateHandler: Function = api.util.AppHelper.debounce((issue: Issue) => {
            this.setIssue(issue);
        }, 3000, true);

        IssueServerEventsHandler.getInstance().onIssueUpdated((issues: Issue[]) => {

            if (!this.issue) {
                return;
            }

            issues.some(issue => {
                if (issue.getId() === this.issue.getId()) {
                    if (this.isVisible() && !this.skipNextServerUpdatedEvent) {
                        updateHandler(issue);
                    } else {
                        // we've probably triggered the save ourselves so just update the pojo and read-only status
                        this.issue = issue;
                        this.setReadOnly(issue && issue.getIssueStatus() === IssueStatus.CLOSED);
                    }
                    return true;
                }
            });

            this.skipNextServerUpdatedEvent = false;
        });
    }

    setReadOnly(value: boolean) {
        this.getItemList().setReadOnly(value);
        this.getDependantList().setReadOnly(value);
        this.commentsList.setReadOnly(value);
        this.itemSelector.setReadOnly(value);
        this.assigneesCombobox.setReadOnly(value);
        (<IssueDetailsDialogHeader>this.header).setReadOnly(value);
    }

    getIssue(): Issue {
        return this.issue;
    }

    setIssue(issue: Issue): IssueDetailsDialog {

        const shouldUpdateDialog = (this.isRendered() || this.isRendering()) && issue;
        const isPublishRequest = !!issue && issue.getType() === IssueType.PUBLISH_REQUEST;

        if (shouldUpdateDialog) {
            this.getItemList().setCanBeEmpty(!isPublishRequest);

            this.publishProcessor.setExcludedIds(issue.getPublishRequest().getExcludeIds());

            const ids = issue.getPublishRequest().getItemsIds();
            if (ids.length > 0) {
                this.itemSelector.setValue(ids.map(id => id.toString()).join(';'));
                ContentSummaryAndCompareStatusFetcher.fetchByIds(ids).then(items => {
                    this.setListItems(items);
                });
            } else {
                this.itemSelector.getComboBox().clearSelection(true, false);
                this.getItemList().clearItems();
            }

            (<IssueDetailsDialogHeader>this.header).setTitleId(issue.getIndex()).setTitle(issue.getTitle());

            this.detailsSubTitle.setIssue(issue, true);
            this.toggleControlsAccordingToStatus(issue.getIssueStatus());

            this.commentsList.setParentIssue(issue);

            const newAssignees = issue.getApprovers().join(ComboBox.VALUE_SEPARATOR);
            // force reload value in case some users have been deleted
            this.assigneesCombobox.setValue(newAssignees, false, true);

            this.commentTextArea.setValue('', true);
            this.setReadOnly(issue && issue.getIssueStatus() === IssueStatus.CLOSED);

            let publishScheduleSet;
            if (issue.getPublishFrom() || issue.getPublishTo()) {
                publishScheduleSet = new PropertySet(this.scheduleFormPropertySet.getTree());
                if (issue.getPublishFrom()) {
                    publishScheduleSet.setLocalDateTime('from', 0, api.util.LocalDateTime.fromDate(issue.getPublishFrom()));
                }
                if (issue.getPublishTo()) {
                    publishScheduleSet.setLocalDateTime('to', 0, api.util.LocalDateTime.fromDate(issue.getPublishTo()));
                }
                this.publishScheduleForm.setFormVisible(true);
            } else {
                this.publishScheduleForm.setFormVisible(false);
            }

            this.scheduleFormPropertySet.setPropertySet('publish', 0, publishScheduleSet);
            this.publishScheduleForm.update(this.scheduleFormPropertySet);
        }

        this.issue = issue;

        if (shouldUpdateDialog) {
            this.updateLabels();

            this.tabBar.selectNavigationItem(isPublishRequest ? 1 : 0);

            this.toggleClass('publish-request', isPublishRequest);
        }

        return this;
    }

    private updateLabels() {
        const isComments = this.tabPanel.getPanelShown() === this.commentsPanel;
        const hasComment = isComments && !api.util.StringHelper.isEmpty(this.commentTextArea.getValue());

        this.updateItemsCount();
        this.closeAction.setLabel(this.getCloseButtonLabel(hasComment));
        this.reopenAction.setLabel(this.getReopenButtonLabel());
    }

    hideBackButton() {
        this.header.removeClass('with-back-button');
        this.backButton.hide();
    }

    showBackButton() {
        this.header.addClass('with-back-button');
        this.backButton.show();
    }

    getButtonRow(): IssueDetailsDialogButtonRow {
        return <IssueDetailsDialogButtonRow>super.getButtonRow();
    }

    private initItemListTogglers(itemList: PublishDialogItemList): boolean {
        // ignore event if there're changes as we're just setting loaded values on list
        return itemList.getItemViews().reduce((alreadyMade, itemView) => {
            const toggler = itemView.getIncludeChildrenToggler();
            return (toggler && toggler.toggle(this.areChildrenIncludedInIssue(itemView.getContentId()))) || alreadyMade;
        }, false);
    }

    private saveComment(text: string, action: Action): wemQ.Promise<void> {
        this.skipNextServerUpdatedEvent = true;
        action.setEnabled(false);
        return new CreateIssueCommentRequest(this.issue.getId())
            .setCreator(this.currentUser.getKey())
            .setText(text).sendAndParse()
            .then(issueComment => {
                this.commentsList.addItem(issueComment);
                this.commentTextArea.setValue('').giveFocus();
                api.notify.showFeedback(i18n('notify.issue.commentAdded'));
            });
    }

    protected initActions() {
        this.closeAction = new Action(this.getCloseButtonLabel());
        this.reopenAction = new Action(this.getReopenButtonLabel());
        this.publishAction = new ContentPublishDialogAction(() => this.publish(), this.getPublishButtonLabel());
        this.scheduleAction = new api.ui.Action('action.schedule').onExecuted(() => this.publish());
        this.commentAction = new Action(i18n('action.commentIssue'));
    }

    protected createHeader(title: string): api.ui.dialog.ModalDialogHeader {
        const header = new IssueDetailsDialogHeader(title);
        header.onTitleChanged(() => {
            this.debouncedUpdateIssue(this.issue.getIssueStatus(), true);
        });
        return header;
    }

    private createCloseButton() {
        const closeButton: DialogButton = this.getButtonRow().addAction(this.closeAction);
        closeButton.addClass('close-issue force-enabled');
    }

    private createReopenButton() {
        const reopenButton: DialogButton = this.getButtonRow().addAction(this.reopenAction);
        reopenButton.addClass('reopen-issue green force-enabled');
    }

    private createAddCommentButton() {
        const commentButton: DialogButton = this.getButtonRow().addAction(this.commentAction);
        commentButton.addClass('comment-issue force-enabled');
    }

    private createPublishButton(): DialogButton {
        const publishButton: DialogButton = this.getButtonRow().addAction(this.publishAction);
        publishButton.addClass('publish-issue');
        return publishButton;
    }

    private createScheduleButton(): DialogButton {
        const scheduleButton: DialogButton = this.getButtonRow().addAction(this.scheduleAction);
        scheduleButton.addClass('schedule-issue');
        return scheduleButton;
    }

    private createNoActionMessage() {
        const divEl = new api.dom.DivEl('no-action-message');
        divEl.setHtml(i18n('dialog.issue.noItems'));
        this.getButtonRow().appendChild(divEl);
    }

    private publish() {
        const isPublishRequest = this.isPublishRequestViewed();

        if (isPublishRequest) {
            this.doPublish();
        } else {
            const contents = this.getItemList().getItems();
            const contentWithChildrenIds = contents.filter(content => {
                return this.areChildrenIncludedInIssue(content.getContentId());
            }).map(content => content.getContentId());

            new ContentPublishPromptEvent(contents, false, contentWithChildrenIds).fire();

        }
    }

    private doPublish(): wemQ.Promise<void> {

        return this.createPublishContentRequest().sendAndParse()
            .then((taskId: api.task.TaskId) => {
                const issue = this.issue;
                this.ignoreNextExcludeChildrenEvent = true;
                const issuePublishedHandler = (taskState: TaskState) => {
                    if (taskState === TaskState.FINISHED) {
                        const request = new UpdateIssueRequest(issue.getId()).setIsPublish(true);

                        this.populateSchedule(request).sendAndParse()
                            .then((updatedIssue: Issue) => {
                                this.setIssue(updatedIssue);
                                this.notifyIssueUpdated(updatedIssue);
                                api.notify.showFeedback(i18n('notify.issue.closed', updatedIssue.getTitle()));
                            }).catch(() => {
                            api.notify.showError(i18n('notify.issue.closeError', issue.getTitle()));
                        }).finally(() => {
                            this.unProgressComplete(issuePublishedHandler);
                        });
                    }
                };
                this.onProgressComplete(issuePublishedHandler);
                this.pollTask(taskId);
            }).catch((reason) => {
                this.unlockControls();
                this.close();
                if (reason && reason.message) {
                    api.notify.showError(reason.message);
                    throw reason.message;
                }
            });
    }

    protected countTotal(): number {
        return this.publishProcessor.countTotal();
    }

    protected countDependantItems(): number {
        return this.publishProcessor.getDependantIds().length;
    }

    private populateSchedule(updateIssueRequest: UpdateIssueRequest): UpdateIssueRequest {
        const publishSet = this.scheduleFormPropertySet.getPropertySet('publish');
        if (publishSet) {
            const from = publishSet.getLocalDateTime('from', 0);

            if (from) {
                updateIssueRequest.setPublishFrom(from.toDate());
            }

            const to = publishSet.getLocalDateTime('to', 0);
            if (to) {
                updateIssueRequest.setPublishTo(to.toDate());
            }
        }
        return updateIssueRequest;
    }

    private doUpdateIssue(newStatus: IssueStatus, autoSave: boolean = false): wemQ.Promise<void> {
        const publishRequest = this.createPublishRequest();
        const statusChanged = newStatus !== this.issue.getIssueStatus();

        const updateIssueRequest = new UpdateIssueRequest(this.issue.getId())
            .setTitle(this.header.getTitle().trim())
            .setStatus(newStatus)
            .setAutoSave(autoSave)
            .setApprovers(this.assigneesCombobox.getSelectedDisplayValues().map(o => o.getKey()))
            .setPublishRequest(publishRequest);

        return this.populateSchedule(updateIssueRequest).sendAndParse()
            .then((updatedIssue: Issue) => {
                if (statusChanged) {
                    api.notify.showFeedback(i18n('notify.issue.status', IssueStatusFormatter.formatStatus(newStatus)));
                    this.toggleControlsAccordingToStatus(newStatus);
                } else {
                    api.notify.showFeedback(i18n('notify.issue.updated'));
                }
                this.notifyIssueUpdated(updatedIssue);
                this.skipNextServerUpdatedEvent = true;
            })
            .catch((reason: any) => api.DefaultErrorHandler.handle(reason));
    }

    private createPublishRequest(): PublishRequest {
        const publishRequestItems = this.publishProcessor.getContentToPublishIds()
            .map(contentId => {
                return PublishRequestItem.create()
                    .setId(contentId)
                    .setIncludeChildren(this.areChildrenIncludedInPublishProcessor(contentId))
                    .build();
            });

        return PublishRequest
            .create(this.issue.getPublishRequest())
            .addExcludeIds(this.publishProcessor.getExcludedIds())
            .setPublishRequestItems(publishRequestItems)
            .build();
    }

    private areChildrenIncludedInIssue(id: ContentId): boolean {
        return this.issue.getPublishRequest().hasItemId(id) &&
               !this.issue.getPublishRequest().getExcludeChildrenIds().some(contentId => contentId.equals(id));
    }

    private areChildrenIncludedInPublishProcessor(id: ContentId): boolean {
        return !this.publishProcessor.getExcludeChildrenIds().some(contentId => contentId.equals(id));
    }

    private createPublishContentRequest(): PublishContentRequest {
        const selectedIds = this.publishProcessor.getContentToPublishIds();
        const excludedIds = this.publishProcessor.getExcludedIds();
        const excludedChildrenIds = this.publishProcessor.getExcludeChildrenIds();

        const publishRequest = new PublishContentRequest()
            .setIds(selectedIds)
            .setExcludedIds(excludedIds)
            .setExcludeChildrenIds(excludedChildrenIds);

        const publishSet = this.scheduleFormPropertySet.getPropertySet('publish');
        if (publishSet) {
            const from = publishSet.getLocalDateTime('from', 0);
            if (from) {
                publishRequest.setPublishFrom(from.toDate());
            }

            const to = publishSet.getLocalDateTime('to', 0);
            if (to) {
                publishRequest.setPublishTo(to.toDate());
            }
        }

        return publishRequest;
    }

    protected createItemList(): ListBox<ContentSummaryAndCompareStatus> {
        return new PublishDialogItemList();
    }

    protected createDependantList(): PublishDialogDependantList {
        return new PublishDialogDependantList();
    }

    protected getItemList(): PublishDialogItemList {
        return <PublishDialogItemList>super.getItemList();
    }

    protected getDependantList(): PublishDialogDependantList {
        return <PublishDialogDependantList>super.getDependantList();
    }

    close() {
        this.getItemList().clearExcludeChildrenIds();
        this.publishProcessor.resetDependantIds();

        super.close();

        this.commentsList.clearItems();
        this.updateItemsCountAndButtonLabels();
        this.resetCommentsTabButtons();

        Router.back();
    }

    resetCommentsTabButtons() {
        this.commentAction.setEnabled(false);
        this.updateCloseButtonLabel(false);
    }

    private toggleControlsAccordingToStatus(status: IssueStatus) {
        this.toggleClass('closed', (status === IssueStatus.CLOSED));
    }

    public onIssueUpdated(listener: (issue: Issue) => void) {
        this.updatedListeners.push(listener);
    }

    public unIssueUpdated(listener: (issue: Issue) => void) {
        this.updatedListeners = this.updatedListeners.filter(curr => curr !== listener);
    }

    private notifyIssueUpdated(issue: Issue) {
        this.updatedListeners.forEach(listener => listener(issue));
    }
}
