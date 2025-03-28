import Q from 'q';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {ContentBrowseToolbar} from './ContentBrowseToolbar';
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
import {ContentSummary, ContentSummaryBuilder} from '../content/ContentSummary';
import {ContentId} from '../content/ContentId';
import {ContentPath, ContentPathBuilder} from '../content/ContentPath';
import {NonMobileContextPanelToggleButton} from '../view/context/button/NonMobileContextPanelToggleButton';
import {ContextView} from '../view/context/ContextView';
import {ResponsiveBrowsePanel} from './ResponsiveBrowsePanel';
import {MovedContentItem} from './MovedContentItem';
import {ContentQuery} from '../content/ContentQuery';
import {SearchAndExpandItemEvent} from './SearchAndExpandItemEvent';
import {ContentItemPreviewPanel} from '../view/ContentItemPreviewPanel';
import {ListBoxToolbar} from '@enonic/lib-admin-ui/ui/selector/list/ListBoxToolbar';
import {TreeGridContextMenu} from '@enonic/lib-admin-ui/ui/treegrid/TreeGridContextMenu';
import {SelectableListBoxPanel} from '@enonic/lib-admin-ui/ui/panel/SelectableListBoxPanel';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {SelectableTreeListBoxKeyNavigator} from '@enonic/lib-admin-ui/ui/selector/list/SelectableTreeListBoxKeyNavigator';
import {ActionName, ContentTreeActions} from './ContentTreeActions';
import {ContentAndStatusTreeSelectorItem} from '../item/ContentAndStatusTreeSelectorItem';
import {ContentsTreeGridList, ContentsTreeGridListElement} from './ContentsTreeGridList';
import {ContentsTreeGridRootList} from './ContentsTreeGridRootList';
import {State} from './State';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {EditContentEvent} from '../event/EditContentEvent';
import {GetContentSummaryByIdRequest} from '../resource/GetContentSummaryByIdRequest';
import {ContentActionMenuButton} from '../ContentActionMenuButton';
import {MenuButtonDropdownPos} from '@enonic/lib-admin-ui/ui/button/MenuButton';
import {ContentExistsByPathRequest} from '../resource/ContentExistsByPathRequest';
import {TreeListBoxExpandedHolder} from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';

export class ContentBrowsePanel
    extends ResponsiveBrowsePanel {

    protected browseToolbar: ContentBrowseToolbar;
    protected filterPanel: ContentBrowseFilterPanel;
    private debouncedFilterRefresh: () => void;
    private debouncedBrowseActionsAndPreviewRefreshOnDemand: () => void;
    private browseActionsAndPreviewUpdateRequired: boolean = false;

    private state: State;

    protected treeListBox: ContentsTreeGridRootList;

    protected treeActions: ContentTreeActions;

    protected toolbar: ListBoxToolbar<ContentAndStatusTreeSelectorItem>;

    protected contextMenu: TreeGridContextMenu;

    protected keyNavigator: SelectableTreeListBoxKeyNavigator<ContentSummaryAndCompareStatus>;

    protected selectionWrapper: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>;

    protected selectableListBoxPanel: SelectableListBoxPanel<ContentSummaryAndCompareStatus>;

    protected expandedContext: TreeListBoxExpandedHolder;

    protected initElements() {
        super.initElements();

        this.browseToolbar.addActions(this.getBrowseActions().getAllActionsNoPublish());

        this.debouncedFilterRefresh = AppHelper.debounce(this.refreshFilter.bind(this), 1000);
        this.debouncedBrowseActionsAndPreviewRefreshOnDemand = AppHelper.debounce(() => {
            if (this.browseActionsAndPreviewUpdateRequired) {
                this.updateActionsAndPreview();
            }
        }, 300);

        this.getBrowseActions().updateActionsEnabledState([]);
    }

    private handleProjectNotSet() {
        this.getBrowseActions().setState(State.DISABLED);
        this.toggleFilterPanelAction.setEnabled(false);
        this.contextSplitPanelToggler.setEnabled(false);
        this.setContentTreeState(State.DISABLED);

        const projectSetHandler = () => {
            this.getBrowseActions().setState(State.ENABLED);
            this.toggleFilterPanelAction.setEnabled(true);
            this.contextSplitPanelToggler.setEnabled(true);
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

        this.treeListBox.onItemsAdded((items: ContentSummaryAndCompareStatus[], itemViews: ContentsTreeGridListElement[]) => {
            items.forEach((item: ContentSummaryAndCompareStatus, index) => {
                const listElement = itemViews[index]?.getDataView();

                listElement?.onDblClicked((event: MouseEvent) => {
                    const target = event.target;

                    if (target instanceof HTMLElement && target.classList.contains('toggle')) {
                        return;
                    }

                    new EditContentEvent([item]).fire();
                });

                listElement?.onContextMenu((event: MouseEvent) => {
                    event.preventDefault();
                    this.contextMenu.showAt(event.clientX, event.clientY);
                });
            });

            itemViews?.forEach((itemView: ContentsTreeGridListElement) => {
                const itemId = this.treeListBox.getIdOfItem(itemView.getItem());
                const wasExpanded = this.expandedContext.isExpanded(itemId);

                if (wasExpanded) {
                    itemView.whenRendered(() => {
                        const isStillExpanded = this.expandedContext.isExpanded(itemId);

                        if (isStillExpanded) {
                            itemView.expand();
                        }
                    });
                }
            });
        });

        this.selectionWrapper.whenRendered(() => {
           this.treeListBox.load();
        });
    }

    createListBoxPanel(): SelectableListBoxPanel<ContentSummaryAndCompareStatus> {
        this.expandedContext = new TreeListBoxExpandedHolder();
        this.treeListBox = new ContentsTreeGridRootList({scrollParent: this, expandedContext : this.expandedContext});

        this.selectionWrapper = new SelectableListBoxWrapper<ContentSummaryAndCompareStatus>(this.treeListBox, {
            className: 'content-list-box-wrapper content-tree-grid',
            maxSelected: 0,
            checkboxPosition: 'left',
            highlightMode: true,
        });

        this.toolbar = new ListBoxToolbar<ContentSummaryAndCompareStatus>(this.selectionWrapper, {
            refreshAction: () => this.treeListBox.reload(),
        });

        this.treeActions = new ContentTreeActions(this.selectionWrapper);
        this.contextMenu = new TreeGridContextMenu(this.treeActions);
        this.keyNavigator = new SelectableTreeListBoxKeyNavigator(this.selectionWrapper);

        const panel = new SelectableListBoxPanel(this.selectionWrapper, this.toolbar);
        panel.addClass('content-selectable-list-box-panel');

        return panel;
    }

    protected getBrowseActions(): ContentTreeActions {
        return this.treeActions;
    }

    getActions(): Action[] {
        return [
            ...super.getActions(),
            ...this.getPreviewPanel().getActions(),
            ...this.getBrowseActions().getPublishActions(),
            this.getBrowseActions().getToggleSearchPanelAction()
        ];
    }

    protected createToolbar(): ContentBrowseToolbar {
        return new ContentBrowseToolbar(this.getBrowseActions().getPublishAction());
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
                this.treeListBox.reload();
            }
        });

        ProjectContext.get().onProjectChanged(() => {
            this.selectionWrapper.deselectAll(true);
            this.filterPanel.reset().then(() => {
                this.hideFilterPanel();
                this.toggleFilterPanelButton.removeClass('filtered');
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
            new ContentExistsByPathRequest(path).sendAndParse().then((exists: boolean) => {
                const targetPath = ContentPath.create().fromString(path).build();
                this.expandToListElementByPath(this.treeListBox, targetPath.getPathAtLevel(1), targetPath);
            }).catch(DefaultErrorHandler.handle);
        }
    }

    private getPathFromInlinePath(contentPreviewPath: string): string {
        return UriHelper.getPathFromPortalInlineUri(contentPreviewPath, RenderingMode.INLINE);
    }

    private expandToListElementByPath(list: ContentsTreeGridList, itemPath: ContentPath, targetPath: ContentPath): void {
        let loadCount = 0;

        const itemFinder = () => {
            const listElement = list.getListElementByPath(itemPath);

            if (listElement) {
                list.unItemsAdded(itemFinder);

                listElement.whenRendered(() => {
                    listElement.getHTMLElement().scrollIntoView();

                    if (itemPath.equals(targetPath)) {
                        this.selectionWrapper.deselectAll();
                        this.selectionWrapper.select(listElement.getItem());
                    } else {
                        listElement.expand(); // if was loaded but the children list collapsed
                        this.expandToListElementByPath(listElement.getList(), targetPath.getPathAtLevel(itemPath.getLevel() + 1), targetPath);
                    }
                });
            } else {
                if (loadCount > 10) {
                    return;
                }

                loadCount++;
                list.load();
            }
        };

        list.onItemsAdded(itemFinder);
        itemFinder();
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
            this.addNewItemToList(item);
        });
    }

    private addNewItemToList(item: ContentSummaryAndCompareStatus): void {
        this.treeListBox.findParentLists(item).forEach(list => {
            // if filtered or already present, don't add to root list
            if ((!this.treeListBox.isFiltered() || list !== this.treeListBox) && !list.getItem(item.getId())) {
                list.addNewItems([item]);
                this.setListItemHasChildren(list); // if item didn't have children before then need to update it without re-fetching

                if (list.getParentItem() && this.selectionWrapper.isItemSelected(list.getParentItem())) {
                    this.updateBrowseActions();
                }
            }
        });
    }

    private setListItemHasChildren(list: ContentsTreeGridList): void {
        const listItem = list.getParentItem();

        if (listItem && !listItem.hasChildren()) {
            const newContSumm = new ContentSummaryBuilder(listItem.getContentSummary()).setHasChildren(true).build();
            const newContSummAndCompStatus = ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(newContSumm,
                listItem.getCompareStatus(), listItem.getPublishStatus());
            list.getParentListElement().replaceItems(newContSummAndCompStatus);
        }
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

    private deleteTreeItems(toDeleteItems: DeletedContentItem[]): void {
        const itemsToDeselect = toDeleteItems.map(toDeleteItem => ContentSummaryAndCompareStatus.fromContentSummary(
            new ContentSummaryBuilder().setId(toDeleteItem.id.toString()).build()));
        this.selectionWrapper.deselect(itemsToDeselect);

        const filteredChildren = toDeleteItems.filter(toDeleteItem => {
            return !toDeleteItems.some(item => toDeleteItem.path.isDescendantOf(item.path));
        });

        filteredChildren.forEach((toDeleteItem) => {
            this.deleteItemAndUpdateParentsLists(toDeleteItem);
        });
    }

    private deleteItemAndUpdateParentsLists(toDeleteItem: DeletedContentItem): void {
        this.treeListBox.findParentLists(toDeleteItem.path).forEach(parentList => {
            if (parentList.wasAlreadyShownAndLoaded()) {
                this.removeItemFromParentList(parentList, toDeleteItem);
            }

            this.updateParentListHasChildren(parentList);
        });
    }

    private removeItemFromParentList(parentList: ContentsTreeGridList, toDeleteItem: DeletedContentItem): void {
        const itemInList = parentList.getItems().find(item => item.getContentId().equals(toDeleteItem.id));

        if (itemInList) {
            parentList.removeItems(itemInList);
        }
    }

    private updateParentListHasChildren(parentList: ContentsTreeGridList): void {
        const parentItem = parentList.getParentItem();

        if (!parentItem) {
            return;
        }

        new GetContentSummaryByIdRequest(parentItem.getContentId()).sendAndParse().then((updatedItem) => {
            if (!updatedItem.hasChildren()) {
                const newContSumm = new ContentSummaryBuilder(updatedItem).build();
                const newContSummAndCompStatus = ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(
                    newContSumm,
                    parentItem.getCompareStatus(), parentItem.getPublishStatus());
                parentList.getParentList().replaceItems(newContSummAndCompStatus);
            }
        }).catch(DefaultErrorHandler.handle);
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
                const parentLists = this.treeListBox.findParentLists(newItem);
                parentLists.forEach(list => list.replaceItems(newItem));
            } else if (this.selectionWrapper.isItemSelected(newItem)) {
                // Need to update selected item anyway
                this.selectionWrapper.updateItemIfSelected(newItem);
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
                const itemList = itemElement.getList();

                if (itemList.wasAlreadyShownAndLoaded()) {
                    itemList.reload();
                }
            });
        });

        this.updateContextPanel(data);
    }

    private handleNewMediaUpload(event: NewMediaUploadEvent) {
        event.getUploadItems().forEach((item: UploadItem<ContentSummary>) => {
            this.appendUploadNode(item, event.getParentContent());
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

        this.selectionWrapper.onSelectionChanged(() => {
            const totalSelected: number = this.selectionWrapper.getSelectedItems().length;

            if (totalSelected === 0) {
                contentActionMenuButton.setItem(null);
            } else if (totalSelected === 1) {
                const item = this.selectionWrapper.getSelectedItems()[0];
                contentActionMenuButton.setItem(item.hasUploadItem() ? null : item);
            }
        });

        this.browseToolbar.addContainer(contentActionMenuButton, contentActionMenuButton.getChildControls());
        this.browseToolbar.addElement(this.contextSplitPanelToggler);

        browseActions.onBeforeActionsStashed(() => {
            contentActionMenuButton.setRefreshDisabled(true);
        });

        browseActions.onActionsUnStashed(() => {
            contentActionMenuButton.setRefreshDisabled(false);
        });
    }

    private handleCUD() {
        if (this.selectableListBoxPanel.getSelectedItems().length > 0) {
            this.browseActionsAndPreviewUpdateRequired = true;
            this.debouncedBrowseActionsAndPreviewRefreshOnDemand();
        }
    }

    protected updateActionsAndPreview(): void {
        this.browseActionsAndPreviewUpdateRequired = false;

        super.updateActionsAndPreview();
    }

    protected togglePreviewPanelDependingOnScreenSize(item: ResponsiveItem): void {
        //
    }

    protected updateContextView(item: ContentSummaryAndCompareStatus): Q.Promise<void> {
        return this.contextView.setItem(item?.hasContentSummary() ? item : null);
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

    appendUploadNode(item: UploadItem<ContentSummary>, parentContent?: ContentSummary): void {
        const data: ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatus.fromUploadItem(item);
        const pLists = parentContent ? this.treeListBox.findParentLists(
            new ContentPathBuilder().fromParent(parentContent.getPath(), data.getId()).build()) : [this.treeListBox];

        const isAlreadyUploading = pLists.some(pList => pList.getItem(item.getId()));

        if (isAlreadyUploading) {
            return;
        }

        pLists.forEach(parent => {
            parent.addNewItems([data]);
        });

        this.addUploadItemListeners(data, pLists);
    }

    private addUploadItemListeners(data: ContentSummaryAndCompareStatus, parentLists: ContentsTreeGridList[]) {
        const uploadItem: UploadItem<ContentSummary> = data.getUploadItem();
        const listElement = this.treeListBox.getItemView(data) as ContentsTreeGridListElement;

        uploadItem.onProgress(() => {
            listElement.setItem(data);
        });

        uploadItem.onUploaded(() => {
            parentLists.forEach(parent => parent.removeItems(data));
            showFeedback(i18n('notify.item.created', data.getContentSummary().getType().toString(), uploadItem.getName()));
        });

        uploadItem.onFailed(() => {
            parentLists.forEach(parent => parent.removeItems(data));
        });
    }
}
