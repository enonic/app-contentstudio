import * as Q from 'q';
import {showError, showFeedback} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {Element} from 'lib-admin-ui/dom/Element';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {Issue} from '../Issue';
import {ContentPublishPromptEvent} from '../../browse/ContentPublishPromptEvent';
import {Router} from '../../Router';
import {PublishDialogItemList} from '../../publish/PublishDialogItemList';
import {ContentPublishDialogAction} from '../../publish/ContentPublishDialogAction';
import {ContentPublishDialog} from '../../publish/ContentPublishDialog';
import {PublishDialogDependantList} from '../../publish/PublishDialogDependantList';
import {UpdateIssueRequest} from '../resource/UpdateIssueRequest';
import {IssueStatus, IssueStatusFormatter} from '../IssueStatus';
import {IssueServerEventsHandler} from '../event/IssueServerEventsHandler';
import {PublishRequest} from '../PublishRequest';
import {PublishRequestItem} from '../PublishRequestItem';
import {IssueDetailsDialogButtonRow} from './IssueDetailsDialogDropdownButtonRow';
import {IssueDetailsDialogSubTitle} from './IssueDetailsDialogSubTitle';
import {PublishProcessor} from '../../publish/PublishProcessor';
import {
    DependantItemsWithProgressDialog,
    DependantItemsWithProgressDialogConfig
} from '../../dialog/DependantItemsWithProgressDialog';
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
import {DialogButton} from 'lib-admin-ui/ui/dialog/DialogButton';
import {TaskState} from 'lib-admin-ui/task/TaskState';
import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {Action} from 'lib-admin-ui/ui/Action';
import {Principal} from 'lib-admin-ui/security/Principal';
import {Tooltip} from 'lib-admin-ui/ui/Tooltip';
import {NavigatedDeckPanel} from 'lib-admin-ui/ui/panel/NavigatedDeckPanel';
import {TabBar} from 'lib-admin-ui/ui/tab/TabBar';
import {TabBarItem, TabBarItemBuilder} from 'lib-admin-ui/ui/tab/TabBarItem';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {PrincipalComboBox} from 'lib-admin-ui/ui/security/PrincipalComboBox';
import {PrincipalType} from 'lib-admin-ui/security/PrincipalType';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {PrincipalLoader} from 'lib-admin-ui/security/PrincipalLoader';
import {ComboBox} from 'lib-admin-ui/ui/selector/combobox/ComboBox';
import {PropertySet} from 'lib-admin-ui/data/PropertySet';
import {ButtonEl} from 'lib-admin-ui/dom/ButtonEl';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {ModalDialogHeader} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {LocalDateTime} from 'lib-admin-ui/util/LocalDateTime';
import {IsAuthenticatedRequest} from 'lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {IssueComment} from '../IssueComment';

export class IssueDetailsDialog
    extends DependantItemsWithProgressDialog {

    private issue: Issue;

    private currentUser: Principal;

    private errorTooltip: Tooltip;

    private static INSTANCE: IssueDetailsDialog;

    private itemsTab: TabBarItem;

    private commentsTab: TabBarItem;

    private assigneesTab: TabBarItem;

    private tabPanel: NavigatedDeckPanel;

    private closeAction: Action;

    private reopenAction: Action;

    private commentAction: Action;

    private detailsSubTitle: IssueDetailsDialogSubTitle;

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

    private assigneesCombobox: PrincipalComboBox;

    private scheduleAction: Action;

    private publishScheduleForm: PublishScheduleForm;

    private scheduleFormPropertySet: PropertySet;

    private updatedListeners: { (issue: Issue): void }[] = [];

    private scheduleFormToggle: ButtonEl;

    private backButtonClickedListeners: { (): void }[] = [];

    private publishMessage: H6El;

    private isUpdatePending: boolean;

    protected constructor() {
        super(<DependantItemsWithProgressDialogConfig>{
                title: i18n('dialog.issue'),
                class: 'issue-dialog issue-details-dialog grey-header',
                dialogSubName: i18n('dialog.issue.resolving'),
                processingLabel: `${i18n('field.progress.publishing')}...`,
                buttonRow: new IssueDetailsDialogButtonRow(),
                processHandler: () => {
                    new ContentPublishPromptEvent({model: []}).fire();
                },
                confirmation: {}
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
        this.detailsSubTitle = new IssueDetailsDialogSubTitle(this.issue);
        this.loadCurrentUser().done(currentUser => {
            this.commentTextArea.setUser(currentUser);
            this.detailsSubTitle.setUser(currentUser);
        });

        this.scheduleFormPropertySet = new PropertySet();
        this.publishScheduleForm = new PublishScheduleForm(this.scheduleFormPropertySet);
        this.publishScheduleForm.layout(false);
        this.scheduleFormToggle = this.publishScheduleForm.createExternalToggle();

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
        this.isUpdatePending = false;
    }

    protected initTabs() {
        const userLoader = new PrincipalLoader().setAllowedTypes([PrincipalType.USER]).skipPrincipals(
            [PrincipalKey.ofAnonymous(), PrincipalKey.ofSU()]);
        this.assigneesCombobox = <PrincipalComboBox>PrincipalComboBox.create().setLoader(userLoader).build();
        this.commentsList = new IssueCommentsList();

        this.assigneesTab = IssueDetailsDialog.createTabBar('assignees');
        this.commentsTab = IssueDetailsDialog.createTabBar('comments');
        this.itemsTab = IssueDetailsDialog.createTabBar('items');

        this.assigneesPanel = new Panel();
        this.commentsPanel = new Panel();
        this.itemsPanel = new Panel();
    }

    private static createTabBar(name: string): TabBarItem {
        const tab = new TabBarItemBuilder().setLabel(i18n(`field.${name}`)).setAddLabelTitleAttribute(false).build();
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
            this.closeAction.setVisible(saveAllowed);
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

        this.detailsSubTitle.onIssueStatusChanged(() => {
            this.updateIssue();
        });

        this.backButton.onClicked(() => this.notifyBackButtonClicked());

        const updateTabCount = (save) => {
            let count = 0;
            const loader = this.assigneesCombobox.getLoader();
            if (loader.isPreLoaded() || loader.isLoaded()) {
                count = this.assigneesCombobox.getSelectedValues().length;
            }
            this.updateTabLabel(2, i18n('field.assignees'), count);
            if (save) {
                this.updateIssue();
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
            this.getHeader().setReadOnly(editMode);
            this.setActionsEnabled(!editMode);
        });

        this.commentsList.onItemsAdded((itemsAdded: IssueComment[]) => {
            const debouncedScroll: Function = AppHelper.debounce(() => {
                if (this.commentsList.isVisible()) {
                    const element: HTMLElement = this.getBody().getHTMLElement();
                    element.scrollTop = element.scrollHeight - element.clientHeight;
                }
            }, 100);
            itemsAdded.forEach((itemAdded: IssueComment) => {
                const itemView: Element = this.commentsList.getItemView(itemAdded);
                if (!!itemView && !itemView.isRendered()) {
                    const renderedHandler = () => {
                        debouncedScroll();
                        itemView.unRendered(renderedHandler);
                    };
                    itemView.onRendered(renderedHandler);
                }
            });
        });

        this.itemSelector.onOptionSelected(option => {
            this.saveOnLoaded = true;
            this.isUpdatePending = true;
            const ids = [option.getSelectedOption().getOption().displayValue.getContentId()];
            ContentSummaryAndCompareStatusFetcher.fetchByIds(ids).then(result => {
                this.addListItems(result);
            });
        });

        this.itemSelector.onOptionDeselected(option => {
            this.saveOnLoaded = true;
            this.isUpdatePending = true;
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
            const hasComment = isComments && !StringHelper.isEmpty(this.commentTextArea.getValue());
            this.closeAction.setVisible(hasComment);
        });

        this.closeAction.onExecuted(action => {
            const comment = this.commentTextArea.getValue();
            const hasComment = !StringHelper.isEmpty(comment);
            if (!hasComment) {
                return;
            }

            action.setEnabled(false);
            this.saveComment(comment, this.commentAction, true).then(() => {
                this.detailsSubTitle.setStatus(IssueStatus.CLOSED);
            }).catch(DefaultErrorHandler.handle).finally(() => {
                action.setEnabled(true);
            });
        });

        this.reopenAction.onExecuted(() => {
            this.detailsSubTitle.setStatus(IssueStatus.OPEN);
        });

        this.commentAction.onExecuted(action => {
            const comment = this.commentTextArea.getValue();
            this.saveComment(comment, action);
        });

        this.scheduleFormPropertySet.onChanged(() => {
            if (this.isRendered()) {
                this.updateItemsCountAndButtonLabels();
                if (this.publishScheduleForm.isFormVisible() && this.publishScheduleForm.isFormValid()) {
                    this.updateIssue();
                }
            }
        });
        this.publishScheduleForm.onFormVisibilityChanged((visible) => {
            if (this.isRendered()) {
                this.updateItemsCountAndButtonLabels();
                if (!visible) {
                    this.updateIssue();
                }
            }
            this.toggleClass('with-schedule-form', visible);
        });

        this.initElementListeners();

        this.handleIssueGlobalEvents();
    }

    private updateTabLabel(tabIndex: number, label: string, count: number) {
        this.tabBar.getNavigationItem(tabIndex).setLabel(IssueDetailsDialog.makeLabelWithCounter(label, count), false, false);
    }

    private static makeLabelWithCounter(label: string, count: number = 0): string {
        return (count > 0 ? `${label} (${count})` : label);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const isPublishRequest = this.isPublishRequest();

            this.getButtonRow().addElement(this.scheduleFormToggle);
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
            this.itemsPanel.appendChildren<DivEl>(this.publishScheduleForm, this.itemSelector, itemList,
                this.getDependantsContainer());

            this.tabPanel.addNavigablePanel(this.commentsTab, this.commentsPanel, !isPublishRequest);
            this.tabPanel.addNavigablePanel(this.itemsTab, this.itemsPanel, isPublishRequest);
            this.tabPanel.addNavigablePanel(this.assigneesTab, this.assigneesPanel);

            this.publishMessage = new H6El('sub-title');
            this.appendChildToHeader(this.publishMessage);

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

    private isPublishRequest(issue: Issue = this.issue): boolean {
        return !!issue && issue.getType() === IssueType.PUBLISH_REQUEST;
    }

    private getItemsTabLabel(): string {
        return this.isPublishRequest() ? i18n('field.publishRequest') : i18n('field.items');
    }

    private getCloseButtonLabel(): string {
        return this.isPublishRequest() ? i18n('action.commentAndCloseRequest') : i18n('action.commentAndCloseTask');
    }

    private getReopenButtonLabel(): string {
        return this.isPublishRequest() ? i18n('action.reopenRequest') : i18n('action.reopenTask');
    }

    private getPublishButtonLabel(itemsCount: number = 0): string {
        const isPublishRequestViewed = this.isPublishRequest();

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

    private updateControls(itemsToPublish: number = this.countTotal()) {
        this.toggleAction(itemsToPublish > 0);

        const canPublish = this.publishProcessor.areAllConditionsSatisfied(itemsToPublish);
        const scheduleValid = !this.publishScheduleForm.isFormVisible() || this.publishScheduleForm.isFormValid();

        this.publishAction.setEnabled(canPublish && scheduleValid);
        this.scheduleAction.setEnabled(canPublish && scheduleValid);
        if (this.isPublishRequest()) {
            this.scheduleFormToggle.getEl().setDisabled(this.publishProcessor.isAllPendingDelete() || !canPublish);
        }
        this.errorTooltip.setActive(this.publishProcessor.containsInvalidItems());

        this.getButtonRow().focusDefaultAction();
        this.updateTabbable();
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
            this.tabPanel.selectPanelByIndex(this.isPublishRequest() ? 1 : 0);
        }
        this.toggleClass('with-schedule-form', this.publishScheduleForm.isFormVisible());
        this.isUpdatePending = false;

        Router.get().setHash('issue/' + this.issue.getId());
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
            this.isUpdatePending = true;
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
                this.updateIssue();
                this.saveOnLoaded = false;
            }

            if (this.publishProcessor.containsInvalidDependants()) {
                this.setDependantListVisible(true);
            }
        });

        this.publishProcessor.onLoadingFailed(() => {
            this.isUpdatePending = false;
        });
    }

    protected getDependantIds(): ContentId[] {
        return this.publishProcessor.getDependantIds();
    }

    private loadCurrentUser(): Q.Promise<Principal> {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult) => {
            this.currentUser = loginResult.getUser();
            return this.currentUser;
        });
    }

    private handleIssueGlobalEvents() {
        const updateHandler: Function = AppHelper.debounce((issue: Issue) => {
            this.setIssue(issue);
        }, 3000, true);

        IssueServerEventsHandler.getInstance().onIssueUpdated((issues: Issue[]) => {

            if (!this.issue) {
                return;
            }

            issues.some(issue => {
                if (issue.getId() === this.issue.getId()) {
                    if (this.canUpdateDialog()) {
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

    private canUpdateDialog(): boolean {
        const isPresent = this.isOpen() || this.getParentElement() != null;
        return isPresent && !this.skipNextServerUpdatedEvent;
    }

    setReadOnly(value: boolean) {
        this.getItemList().setReadOnly(value);
        this.getDependantList().setReadOnly(value);
        this.commentsList.setReadOnly(value);
        this.itemSelector.setReadOnly(value);
        this.assigneesCombobox.setReadOnly(value);
        this.getHeader().setReadOnly(value);
    }

    private getHeader(): IssueDetailsDialogHeader {
        return <IssueDetailsDialogHeader>this.header;
    }

    getIssue(): Issue {
        return this.issue;
    }

    setIssue(issue: Issue): IssueDetailsDialog {

        const forceUpdateDialog = (this.isRendered() || this.isRendering()) && !!issue;
        const isPublishRequest = this.isPublishRequest(issue);
        this.toggleClass('publish-request', isPublishRequest);

        this.issue = issue;

        if (!forceUpdateDialog) {
            return this;
        }

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

        this.getHeader().setTitleId(issue.getIndex()).setHeading(issue.getTitle());

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
                publishScheduleSet.setLocalDateTime('from', 0, LocalDateTime.fromDate(issue.getPublishFrom()));
            }
            if (issue.getPublishTo()) {
                publishScheduleSet.setLocalDateTime('to', 0, LocalDateTime.fromDate(issue.getPublishTo()));
            }
            this.publishScheduleForm.setFormVisible(true, true);
        } else {
            this.publishScheduleForm.setFormVisible(false, true);
        }

        this.scheduleFormPropertySet.setPropertySet('publish', 0, publishScheduleSet);
        this.publishScheduleForm.update(this.scheduleFormPropertySet);

        this.updateLabels();

        return this;
    }

    private updateLabels() {
        this.updateItemsCount();
        this.closeAction.setLabel(this.getCloseButtonLabel());
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

    private saveComment(text: string, action: Action, silent?: boolean): Q.Promise<void> {
        this.skipNextServerUpdatedEvent = true;
        action.setEnabled(false);
        return new CreateIssueCommentRequest(this.issue.getId())
            .setCreator(this.currentUser.getKey())
            .setSilent(silent)
            .setText(text).sendAndParse()
            .then(issueComment => {
                this.commentsList.addItem(issueComment);
                this.commentTextArea.setValue('').giveFocus();
                const messageKey = this.isPublishRequest() ? 'notify.publishRequest.commentAdded' : 'notify.issue.commentAdded';
                showFeedback(i18n(messageKey));
            });
    }

    protected initActions() {
        this.closeAction = new Action(this.getCloseButtonLabel()).setVisible(false);
        this.reopenAction = new Action(this.getReopenButtonLabel());
        this.publishAction = new ContentPublishDialogAction(() => this.publish(), this.getPublishButtonLabel());
        this.scheduleAction = new Action('action.schedule').onExecuted(() => this.publish());
        this.commentAction = new Action(i18n('action.commentIssue'));
    }

    protected createHeader(title: string): ModalDialogHeader {
        const header = new IssueDetailsDialogHeader(title);
        header.onTitleChanged(() => {
            this.updateIssue();
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
        const publishButton: DialogButton = this.getButtonRow().addAction(this.publishAction, true);
        publishButton.addClass('publish-issue');
        return publishButton;
    }

    private createScheduleButton(): DialogButton {
        const scheduleButton: DialogButton = this.getButtonRow().addAction(this.scheduleAction);
        scheduleButton.addClass('schedule-issue');
        return scheduleButton;
    }

    private createNoActionMessage() {
        const divEl = new DivEl('no-action-message');
        divEl.setHtml(i18n('dialog.issue.noItems'));
        this.getButtonRow().appendChild(divEl);
    }

    private publish() {
        const isPublishRequest = this.isPublishRequest();

        if (isPublishRequest) {
            this.doPublish();
            return;
        }

        const contents = this.getItemList().getItems();
        const exceptedContentIds = contents.filter(content => {
            return this.areChildrenIncludedInIssue(content.getContentId());
        }).map(content => content.getContentId());

        const excludedIds = this.publishProcessor.getExcludedIds();

        const includeChildItems = false;
        const message = this.issue.getTitle();

        new ContentPublishPromptEvent({
            model: contents,
            includeChildItems,
            exceptedContentIds,
            excludedIds,
            message
        }).fire();

        const publishDialog = ContentPublishDialog.get();
        const closedListener = () => {
            publishDialog.unProgressComplete(progressCompleteListener);
            publishDialog.unClosed(closedListener);
        };
        const progressCompleteListener = (taskState: TaskState) => {
            if (taskState === TaskState.FINISHED) {
                this.doUpdateIssueAfterPublish(this.issue);
            }
        };

        publishDialog.onProgressComplete(progressCompleteListener);
        publishDialog.onClosed(closedListener);
    }

    private doPublish(): Q.Promise<void> {

        this.publishMessage.setHtml(i18n('dialog.publish.publishing', this.countTotal()));

        return this.createPublishContentRequest().sendAndParse()
            .then((taskId: TaskId) => {
                const issue = this.issue;
                this.ignoreNextExcludeChildrenEvent = true;
                const issuePublishedHandler = (taskState: TaskState) => {
                    if (taskState === TaskState.FINISHED) {
                        this.doUpdateIssueAfterPublish(issue).finally(() => {
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
                    showError(reason.message);
                    throw reason.message;
                }
            });
    }

    private doUpdateIssueAfterPublish(issue: Issue): Q.Promise<void> {
        const request = new UpdateIssueRequest(issue.getId()).setIsPublish(true).setStatus(IssueStatus.CLOSED);

        return this.populateSchedule(request).sendAndParse()
            .then((updatedIssue: Issue) => {
                this.setIssue(updatedIssue);
                this.notifyIssueUpdated(updatedIssue);
                const messageKey = this.isPublishRequest() ? 'notify.publishRequest.closed' : 'notify.issue.closed';
                showFeedback(i18n(messageKey, updatedIssue.getTitle()));
            }).catch(() => {
                const messageKey = this.isPublishRequest() ? 'notify.publishRequest.closeError' : 'notify.issue.closeError';
                showError(i18n(messageKey, issue.getTitle()));
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

    private updateIssue() {
        this.isUpdatePending = true;
        this.debouncedUpdateIssue();
    }

    private doUpdateIssue(): Q.Promise<void> {
        if (!this.isUpdatePending || !this.isOpen()) {
            return;
        }

        this.isUpdatePending = false;

        const publishRequest: PublishRequest = this.createPublishRequest();
        const status: IssueStatus = this.detailsSubTitle.getStatus();
        const statusChanged: boolean = status !== this.issue.getIssueStatus();

        const updateIssueRequest = new UpdateIssueRequest(this.issue.getId())
            .setTitle(this.header.getHeading().trim())
            .setStatus(status)
            .setAutoSave(!statusChanged)
            .setApprovers(this.assigneesCombobox.getSelectedDisplayValues().map(o => o.getKey()))
            .setPublishRequest(publishRequest);

        return this.populateSchedule(updateIssueRequest).sendAndParse()
            .then((updatedIssue: Issue) => {
                if (statusChanged) {
                    const messageKey = this.isPublishRequest() ? 'notify.publishRequest.status' : 'notify.issue.status';
                    showFeedback(i18n(messageKey, IssueStatusFormatter.formatStatus(status)));
                    this.toggleControlsAccordingToStatus(status);
                    this.detailsSubTitle.setIssue(updatedIssue, true);
                } else {
                    const messageKey = this.isPublishRequest() ? 'notify.publishRequest.updated' : 'notify.issue.updated';
                    showFeedback(i18n(messageKey));
                }
                this.notifyIssueUpdated(updatedIssue);
                this.skipNextServerUpdatedEvent = true;
            })
            .catch((reason: any) => DefaultErrorHandler.handle(reason));
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
            .setExcludeIds(this.publishProcessor.getExcludedIds())
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
        const message = this.getIssue().getTitle();

        const publishRequest = new PublishContentRequest()
            .setIds(selectedIds)
            .setMessage(message)
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
        if (this.isUpdatePending) {
            this.doUpdateIssue();
        }

        this.itemSelector.resetBaseValues();
        this.getItemList().clearExcludeChildrenIds();
        this.publishProcessor.resetDependantIds();

        super.close();

        this.commentsList.clearItems();
        this.updateItemsCountAndButtonLabels();
        this.resetCommentsTabButtons();

        Router.get().back();
    }

    resetCommentsTabButtons() {
        this.commentAction.setEnabled(false);
        this.closeAction.setVisible(false);
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

    public onBackButtonClicked(listener: () => void) {
        this.backButtonClickedListeners.push(listener);
    }

    public unBackButtonClicked(listener: () => void) {
        this.backButtonClickedListeners = this.backButtonClickedListeners.filter(curr => curr !== listener);
    }

    private notifyBackButtonClicked() {
        this.backButtonClickedListeners.forEach(listener => listener());
    }
}
