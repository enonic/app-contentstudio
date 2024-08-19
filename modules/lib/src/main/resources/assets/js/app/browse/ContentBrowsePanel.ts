import * as Q from 'q';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {ActionName} from './action/ContentTreeGridActions';
import {ContentBrowseToolbar} from './ContentBrowseToolbar';
import {ContentTreeGrid} from './ContentTreeGrid';
import {ContentBrowseFilterPanel} from './filter/ContentBrowseFilterPanel';
import {ContentBrowseItemPanel} from './ContentBrowseItemPanel';
import {Router} from '../Router';
import {ToggleSearchPanelEvent} from './ToggleSearchPanelEvent';
import {ToggleSearchPanelWithDependenciesEvent} from './ToggleSearchPanelWithDependenciesEvent';
import {NewMediaUploadEvent} from '../create/NewMediaUploadEvent';
import {ContentPreviewPathChangedEvent} from '../view/ContentPreviewPathChangedEvent';
import {RenderingMode} from '../rendering/RenderingMode';
import {UriHelper} from '../rendering/UriHelper';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {UploadItem} from '@enonic/lib-admin-ui/ui/uploader/UploadItem';
import {ResponsiveRanges} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveRanges';
import {RepositoryEvent} from '@enonic/lib-admin-ui/content/event/RepositoryEvent';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {UrlAction} from '../UrlAction';
import {ProjectContext} from '../project/ProjectContext';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {DeletedContentItem} from './DeletedContentItem';
import {IsRenderableRequest} from '../resource/IsRenderableRequest';
import {ContentSummary} from '../content/ContentSummary';
import {ContentId} from '../content/ContentId';
import {ContentPath} from '../content/ContentPath';
import {NonMobileContextPanelToggleButton} from '../view/context/button/NonMobileContextPanelToggleButton';
import {ContextView} from '../view/context/ContextView';
import {ResponsiveBrowsePanel} from './ResponsiveBrowsePanel';
import {MovedContentItem} from './MovedContentItem';
import {ContentQuery} from '../content/ContentQuery';
import {StatusCode} from '@enonic/lib-admin-ui/rest/StatusCode';
import {SearchAndExpandItemEvent} from './SearchAndExpandItemEvent';
import {ContentItemPreviewPanel} from '../view/ContentItemPreviewPanel';
import {ListBoxToolbar} from '@enonic/lib-admin-ui/ui/selector/list/ListBoxToolbar';
import {TreeGridContextMenu} from '@enonic/lib-admin-ui/ui/treegrid/TreeGridContextMenu';
import {SelectableListBoxPanel} from '@enonic/lib-admin-ui/ui/panel/SelectableListBoxPanel';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {SelectableTreeListBoxKeyNavigator} from '@enonic/lib-admin-ui/ui/selector/list/SelectableTreeListBoxKeyNavigator';
import {ContentTreeActions} from './ContentTreeActions';
import {ContentAndStatusTreeSelectorItem} from '../item/ContentAndStatusTreeSelectorItem';
import {ContentsTreeGridList, ContentsTreeGridListElement} from './ContentsTreeGridList';
import {ContentsTreeGridRootList} from './ContentsTreeGridRootList';
import {State} from './State';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {EditContentEvent} from '../event/EditContentEvent';
import {SettingsViewItem} from '../settings/view/SettingsViewItem';
import {SettingsTreeListElement} from '../settings/SettingsTreeList';
import {ContentActionMenuButton} from '../ContentActionMenuButton';
import {MenuButtonDropdownPos} from '@enonic/lib-admin-ui/ui/button/MenuButton';

export class ContentBrowsePanel
    extends ResponsiveBrowsePanel {

    protected treeGrid: ContentTreeGrid;
    protected browseToolbar: ContentBrowseToolbar;
    protected filterPanel: ContentBrowseFilterPanel;
    private debouncedFilterRefresh: () => void;
    private debouncedBrowseActionsAndPreviewRefreshOnDemand: () => void;
    private browseActionsAndPreviewUpdateRequired: boolean = false;
    private contextPanelToggler: NonMobileContextPanelToggleButton;

    private state: State;

    protected treeListBox: ContentsTreeGridRootList;

    protected treeActions: ContentTreeActions;

    protected toolbar: ListBoxToolbar<ContentAndStatusTreeSelectorItem>;

    protected contextMenu: TreeGridContextMenu;

    protected keyNavigator: SelectableTreeListBoxKeyNavigator<ContentSummaryAndCompareStatus>;

    protected selectionWrapper: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>;

    protected selectableListBoxPanel: SelectableListBoxPanel<ContentSummaryAndCompareStatus>;

    protected initElements() {
        super.initElements();

        this.browseToolbar.addActions(this.getBrowseActions().getAllActionsNoPublish());

        this.debouncedFilterRefresh = AppHelper.debounce(this.refreshFilter.bind(this), 1000);
        this.debouncedBrowseActionsAndPreviewRefreshOnDemand = AppHelper.debounce(() => {
            if (this.browseActionsAndPreviewUpdateRequired) {
                this.updateActionsAndPreview();
            }
        }, 300);

        this.contextPanelToggler = new NonMobileContextPanelToggleButton();
        this.getBrowseActions().updateActionsEnabledState([]);
    }

    private handleProjectNotSet() {
        this.getBrowseActions().setState(State.DISABLED);
        this.toggleFilterPanelAction.setEnabled(false);
        this.contextPanelToggler.setEnabled(false);
        this.setContentTreeState(State.DISABLED);

        const projectSetHandler = () => {
            this.getBrowseActions().setState(State.ENABLED);
            this.toggleFilterPanelAction.setEnabled(true);
            this.contextPanelToggler.setEnabled(true);
            this.setContentTreeState(State.ENABLED);
            Router.get().setHash(UrlAction.BROWSE);
            ProjectContext.get().unProjectChanged(projectSetHandler);
        };

        ProjectContext.get().onProjectChanged(projectSetHandler);
    }

    protected initListeners() {
        super.initListeners();

        this.filterPanel.onSearchEvent((query?: ContentQuery) => {
            this.treeListBox.setTargetBranch(this.filterPanel.getTargetBranch());
            this.treeListBox.setFilterQuery(query);
        });

        this.handleGlobalEvents();

        this.selectableListBoxPanel.onSelectionChanged(() => {
            const previewPanel: ContentItemPreviewPanel = this.getPreviewPanel();
            const selectedItem: ContentSummaryAndCompareStatus = this.selectableListBoxPanel.getLastSelectedItem();
            if (!!selectedItem && previewPanel.isPreviewUpdateNeeded(selectedItem)) {
                previewPanel.showMask();
            }
        });

        this.treeListBox.onItemsAdded((items: ContentSummaryAndCompareStatus[], itemViews: ContentsTreeGridListElement[]) => {
            items.forEach((item: ContentSummaryAndCompareStatus, index) => {
                const listElement = itemViews[index]?.getDataView();

                listElement?.onDblClicked(() => {
                    new EditContentEvent([item]).fire();
                });

                listElement?.onContextMenu((event: MouseEvent) => {
                    event.preventDefault();
                    this.contextMenu.showAt(event.clientX, event.clientY);
                });
            });
        });
    }

    createListBoxPanel(): SelectableListBoxPanel<ContentSummaryAndCompareStatus> {
        this.treeListBox = new ContentsTreeGridRootList({scrollParent: this});

        this.selectionWrapper = new SelectableListBoxWrapper<ContentSummaryAndCompareStatus>(this.treeListBox, {
            className: 'content-list-box-wrapper',
            maxSelected: 0,
            checkboxPosition: 'left',
            highlightMode: true,
        });

        this.toolbar = new ListBoxToolbar<ContentSummaryAndCompareStatus>(this.selectionWrapper, {
            refreshAction: () => this.treeListBox.load(),
        });

        this.treeActions = new ContentTreeActions(this.selectionWrapper);
        this.contextMenu = new TreeGridContextMenu(this.treeActions);
        this.keyNavigator = new SelectableTreeListBoxKeyNavigator(this.selectionWrapper);

        const panel =  new SelectableListBoxPanel(this.selectionWrapper, this.toolbar);
        panel.addClass('content-selectable-list-box-panel');

        return panel;
    }

    protected getBrowseActions(): ContentTreeActions {
        return this.treeActions;
    }

    getNonToolbarActions(): Action[] {
        return this.getBrowseActions().getPublishActions();
    }

    getToggleSearchAction(): Action {
        return this.getBrowseActions().getToggleSearchPanelAction();
    }

    protected createToolbar(): ContentBrowseToolbar {
        return new ContentBrowseToolbar(this.getBrowseActions().getPublishAction());
    }

    protected createTreeGrid(): ContentTreeGrid {
        return new ContentTreeGrid();
    }

    protected createBrowseItemPanel(): ContentBrowseItemPanel {
        return new ContentBrowseItemPanel();
    }

    protected createFilterPanel(): ContentBrowseFilterPanel {
        const filterPanel: ContentBrowseFilterPanel = new ContentBrowseFilterPanel();

        const showMask = () => {
            if (this.isVisible()) {
                // show mask on tree?
            }
        };

        filterPanel.onSearchStarted(showMask);

        return filterPanel;
    }

    protected updateFilterPanelOnSelectionChange() {
        this.filterPanel.setSelectedItems(this.selectableListBoxPanel.getSelectedItems().map(item => item.getId()));
    }

    protected enableSelectionMode() {
        this.filterPanel.setSelectedItems(this.selectableListBoxPanel.getSelectedItems().map(item => item.getId()));
    }

    protected disableSelectionMode() {
        this.filterPanel.resetConstraints();
        this.hideFilterPanel();
        super.disableSelectionMode();
        this.treeListBox.setFilterQuery(null);
    }

    protected createContextView(): ContextView {
        return new ContextView();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.getFilterAndGridSplitPanel());

            this.createContentPublishMenuButton();

            this.addClass('content-browse-panel');

            return rendered;
        }).catch((error) => {
            console.error('Couldn\'t render ContentBrowsePanel', error);
            return true;
        });
    }

    private handleGlobalEvents() {
        ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => {
            this.getBrowseActions().getToggleSearchPanelAction().setVisible(
                item.isInRangeOrSmaller(ResponsiveRanges._540_720));
        });

        ToggleSearchPanelEvent.on(() => {
            this.toggleFilterPanel();
        });

        ToggleSearchPanelWithDependenciesEvent.on((event: ToggleSearchPanelWithDependenciesEvent) => {
            if (this.toolbar.getSelectionPanelToggler().isActive()) {
                this.toolbar.getSelectionPanelToggler().setActive(false);
            }

            this.showFilterPanel();
            this.filterPanel.setTargetBranch(event.getBranch());
            this.filterPanel.setDependencyItem(event.getContent(), event.isInbound(), event.getType());
        });

        SearchAndExpandItemEvent.on((event: SearchAndExpandItemEvent) => {
           const contentId: ContentId = event.getContentId();

            if (this.toolbar.getSelectionPanelToggler().isActive()) {
                this.toolbar.getSelectionPanelToggler().setActive(false);
            }

            this.showFilterPanel();
            this.filterPanel.searchItemById(contentId);
        });

        NewMediaUploadEvent.on((event) => {
            this.handleNewMediaUpload(event);
        });

        this.subscribeOnContentEvents();

        ContentPreviewPathChangedEvent.on((event: ContentPreviewPathChangedEvent) => {
            this.selectInlinedContentInGrid(event.getPreviewPath());
        });

        RepositoryEvent.on(event => {
            if (event.isRestored()) {
                this.treeListBox.load();
            }
        });

        ProjectContext.get().onProjectChanged(() => {
            this.selectionWrapper.deselectAll(true);
            this.filterPanel.reset().then(() => {
                this.hideFilterPanel();
                this.toggleFilterPanelButton.removeClass('filtered');
                this.treeListBox.setFilterQuery(null);
            });
        });

        ProjectContext.get().onNoProjectsAvailable(() => {
            this.handleProjectNotSet();
            this.selectionWrapper.deselectAll(true);
            this.treeListBox.clearItems(true);
        });
    }

    private selectInlinedContentInGrid(contentInlinePath: string) {
        const path: string = this.getPathFromInlinePath(contentInlinePath);

        if (path) {
            // possibly don't need this, but presumes expanding tree structure till the item is found
        }
    }

    private getPathFromInlinePath(contentPreviewPath: string): string {
        return UriHelper.getPathFromPortalInlineUri(contentPreviewPath, RenderingMode.INLINE);
    }

    private subscribeOnContentEvents() {
        const handler: ContentServerEventsHandler = ContentServerEventsHandler.getInstance();

        handler.onContentCreated((data: ContentSummaryAndCompareStatus[]) => this.handleContentCreated(data));

        handler.onContentUpdated((data: ContentSummaryAndCompareStatus[]) => this.handleContentUpdated(data));

        handler.onContentPermissionsUpdated((data: ContentSummaryAndCompareStatus[]) => this.handleContentPermissionsUpdated(data));

        handler.onContentRenamed((data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => {
            this.handleContentRenamed(data, oldPaths);
        });

        handler.onContentDeleted((data: ContentServerChangeItem[]) => {
            this.handleContentDeleted(
                data.map((item: ContentServerChangeItem) => new DeletedContentItem(item.getContentId(), item.getPath())));
        });

        handler.onContentPublished((data: ContentSummaryAndCompareStatus[]) => this.handleContentPublished(data));

        handler.onContentUnpublished((data: ContentSummaryAndCompareStatus[]) => this.handleContentUnpublished(data));

        handler.onContentDuplicated((data: ContentSummaryAndCompareStatus[]) => this.handleContentCreated(data));

        handler.onContentMoved((movedItems: MovedContentItem[]) => {
            this.handleContentDeleted(
                movedItems.map((item: MovedContentItem) => new DeletedContentItem(item.item.getContentId(), item.oldPath)));
            this.handleContentCreated(movedItems.map((item: MovedContentItem) => item.item));
        });

        handler.onContentSorted((data: ContentSummaryAndCompareStatus[]) => this.handleContentSorted(data));
    }

    private handleContentCreated(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: created', data);
        }

        if (data?.length > 0) {
            this.handleCUD();
            this.addNewItemsToList(data);
            this.refreshFilterWithDelay();
        }
    }

    private addNewItemsToList(data: ContentSummaryAndCompareStatus[]): void {
        data.forEach((item: ContentSummaryAndCompareStatus) => {
            this.treeListBox.findParentLists(item).forEach(list => list.addNewItems([item]));
        });
    }

    private handleContentRenamed(data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: renamed', data, oldPaths);
        }

        data.forEach((item: ContentSummaryAndCompareStatus) => {
            this.treeListBox.findParentLists(item).forEach(list => list.replaceItems(item));
        });

        this.refreshFilterWithDelay();
    }

    private handleContentUpdated(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: updated', data);
        }

        if (!data || data.length === 0) {
            return;
        }

        this.doHandleContentUpdate(data);
    }

    private handleContentPermissionsUpdated(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: permissions updated', data);
        }

        if (!data || data.length === 0 ||
            !data.some((summary: ContentSummaryAndCompareStatus) => this.treeListBox.getItem(summary.getId()))) {
            return;
        }

        data.forEach((newItem: ContentSummaryAndCompareStatus) => {
            const existingItem: ContentSummaryAndCompareStatus = this.treeListBox.getItem(newItem.getId());

            if (existingItem) {
                newItem.setCompareStatus(existingItem.getCompareStatus());
            }
        });

        this.treeListBox.replaceItems(data);
    }

    private handleContentDeleted(items: DeletedContentItem[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: deleted', items.map(i => i.id.toString()));
        }

        this.handleCUD();
        this.deleteTreeItems(items);

        if (this.treeListBox.isFiltered() && this.treeListBox.getItems().length === 0) {
            this.treeListBox.setFilterQuery(null);
        }

        this.updateContextPanelOnNodesDelete(items);
        this.refreshFilterWithDelay();
    }

    private deleteTreeItems(toDelete: DeletedContentItem[]): void {
        const itemsFound = toDelete
            .map((item) => this.treeListBox.getItem(item.id.toString()))
            .filter((item) => !!item);

        itemsFound.forEach((item) => {
            this.treeListBox.findParentLists(item).forEach(list => list.removeItems(item));
        });
    }

    private updateContextPanelOnNodesDelete(items: DeletedContentItem[]) {
        const itemInDetailPanel: ContentSummaryAndCompareStatus = this.contextView.getItem();

        if (!itemInDetailPanel) {
            return;
        }

        const itemPath: ContentPath = itemInDetailPanel.getContentSummary().getPath();

        if (items.some((item: DeletedContentItem) => item.path.equals(itemPath))) {
            this.doUpdateContextPanel(null);
        }
    }

    private handleContentPublished(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: published', data);
        }

        this.doHandleContentUpdate(data);
    }

    private handleContentUnpublished(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: unpublished', data);
        }
        this.doHandleContentUpdate(data);
    }

    private refreshFilterWithDelay() {
        this.setRefreshOfFilterRequired();
        this.debouncedFilterRefresh();
    }

    private doHandleContentUpdate(data: ContentSummaryAndCompareStatus[]) {
        this.handleCUD();
        this.updateContextPanel(data);

        data.forEach((newItem: ContentSummaryAndCompareStatus) => {
            const existingItem: ContentSummaryAndCompareStatus = this.treeListBox.getItem(newItem.getId());

            if (existingItem) {
                newItem.setReadOnly(existingItem.isReadOnly());
                this.treeListBox.findParentLists(newItem).forEach(list => list.replaceItems(newItem));
            }
        });

        this.refreshFilterWithDelay();
    }

    private handleContentSorted(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: sorted', data);
        }

        data.forEach((item: ContentSummaryAndCompareStatus) => {
            this.treeListBox.findParentLists(item).forEach(list => {
                list.replaceItems(item);

                const itemElement = list.getItemView(item) as ContentsTreeGridListElement;
                const itemList = itemElement.getList() as ContentsTreeGridList;

                if (itemList.wasAlreadyShownAndLoaded()) {
                    itemList.load();
                }
            });
        });

        this.updateContextPanel(data);
    }

    private handleNewMediaUpload(event: NewMediaUploadEvent) {
        event.getUploadItems().forEach((item: UploadItem<ContentSummary>) => {
            this.appendUploadNode(item);
        });
    }

    private updateContextPanel(data: ContentSummaryAndCompareStatus[]) {
        const itemInDetailPanel: ContentSummaryAndCompareStatus = this.contextView.getItem();

        if (!itemInDetailPanel) {
            return;
        }

        let content: ContentSummaryAndCompareStatus = null;
        const isItemInContextPanelUpdated: boolean = data.some((contentItem: ContentSummaryAndCompareStatus) => {
            if (contentItem.getId() === itemInDetailPanel.getId()) {
                content = contentItem;
                return true;
            }
        });

        if (isItemInContextPanelUpdated) {
            this.doUpdateContextPanel(content);
        }
    }

    private doUpdateContextPanel(item: ContentSummaryAndCompareStatus) {
        this.contextView.setItem(item);
    }

    private getPreviewPanel(): ContentItemPreviewPanel {
        return this.getBrowseItemPanel().getItemStatisticsPanel().getPreviewPanel();
    }

    getBrowseItemPanel(): ContentBrowseItemPanel {
        return super.getBrowseItemPanel() as ContentBrowseItemPanel;
    }

    private createContentPublishMenuButton() {
        const browseActions: ContentTreeActions = this.getBrowseActions();
        const contentActionMenuButton: ContentActionMenuButton = new ContentActionMenuButton({
            defaultAction: browseActions.getAction(ActionName.MARK_AS_READY),
            menuActions: [
                browseActions.getAction(ActionName.MARK_AS_READY),
                browseActions.getAction(ActionName.PUBLISH),
                browseActions.getAction(ActionName.PUBLISH_TREE),
                browseActions.getAction(ActionName.UNPUBLISH),
                browseActions.getAction(ActionName.CREATE_ISSUE),
                browseActions.getAction(ActionName.REQUEST_PUBLISH)
            ],
            defaultActionNoContent: browseActions.getAction(ActionName.CREATE_ISSUE),
            debounceRequests: 500,
            dropdownPosition: MenuButtonDropdownPos.RIGHT
        });

        let previousSelectionSize: number = this.selectionWrapper.getSelectedItems().length;

        this.selectionWrapper.onSelectionChanged(() => {
            const totalSelected: number = this.selectionWrapper.getSelectedItems().length;

            if (totalSelected === 0) {
                contentActionMenuButton.setItem(null);
            } else if (totalSelected === 1) {
                contentActionMenuButton.setItem(this.treeGrid.getFirstSelectedItem());
            }
        });

        this.browseToolbar.addContainer(contentActionMenuButton, contentActionMenuButton.getChildControls());
        this.browseToolbar.addElement(this.contextPanelToggler);

        browseActions.onBeforeActionsStashed(() => {
            contentActionMenuButton.setRefreshDisabled(true);
        });

        browseActions.onActionsUnStashed(() => {
            contentActionMenuButton.setRefreshDisabled(false);
        });
    }

    private handleCUD() {
        IsRenderableRequest.clearCache();

        if (this.selectableListBoxPanel.getSelectedItems().length > 0) {
            this.browseActionsAndPreviewUpdateRequired = true;
            this.debouncedBrowseActionsAndPreviewRefreshOnDemand();
        }
    }

    protected updateActionsAndPreview(): void {
        this.browseActionsAndPreviewUpdateRequired = false;

        const selectedItem: ContentSummaryAndCompareStatus = this.selectionWrapper.getSelectedItems().pop();

        if (selectedItem) {
            new IsRenderableRequest(selectedItem.getContentSummary()).sendAndParse().then((statusCode: number) => {
                this.treeListBox.getItem(selectedItem.getId())?.setRenderable(statusCode === StatusCode.OK);
                super.updateActionsAndPreview();
            }).catch(DefaultErrorHandler.handle);
        } else {
            super.updateActionsAndPreview();
        }
    }

    protected togglePreviewPanelDependingOnScreenSize(item: ResponsiveItem): void {
        //
    }

    protected updateContextView(item: ContentSummaryAndCompareStatus): Q.Promise<void> {
        return this.contextView.setItem(item);
    }

    setContentTreeState(state: State) {
        this.state = state;

        if (this.state === State.ENABLED) {
            this.toolbar.enable();
            this.keyNavigator.enableKeys();
        } else {
            this.toolbar.disable();
            this.keyNavigator.disableKeys();
        }
    }

    appendUploadNode(item: UploadItem<ContentSummary>) {
        const data: ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatus.fromUploadItem(item);
        const parentLists = this.treeListBox.findParentLists(data);
        const pLists = parentLists.length > 0 ? parentLists : [this.treeListBox];

        pLists.forEach(parent => {
            parent.addNewItems([data]);
            this.addUploadItemListeners(data);
        });
    }

    private addUploadItemListeners(data: ContentSummaryAndCompareStatus) {
        const uploadItem: UploadItem<ContentSummary> = data.getUploadItem();
        const listElement = this.treeListBox.getItemView(data) as ContentsTreeGridListElement;

        uploadItem.onProgress(() => {
            listElement.updateItemView(data);
        });

        uploadItem.onUploaded(() => {
            this.treeListBox.removeItems(data);
            showFeedback(i18n('notify.item.created', data.getContentSummary().getType().toString(), uploadItem.getName()));
        });

        uploadItem.onFailed(() => {
            this.treeListBox.removeItems(data);
        });
    }
}
