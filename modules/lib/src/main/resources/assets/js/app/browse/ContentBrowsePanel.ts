import { RepositoryEvent } from '@enonic/lib-admin-ui/content/event/RepositoryEvent';
import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { type Action } from '@enonic/lib-admin-ui/ui/Action';
import { ManagedActionManager } from '@enonic/lib-admin-ui/managedaction/ManagedActionManager';
import { ManagedActionState } from '@enonic/lib-admin-ui/managedaction/ManagedActionState';
import { type SelectableListBoxPanel } from '@enonic/lib-admin-ui/ui/panel/SelectableListBoxPanel';
import { ListBoxToolbar } from '@enonic/lib-admin-ui/ui/selector/list/ListBoxToolbar';
import { SelectableListBoxWrapper } from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import { type SelectableTreeListBoxKeyNavigator } from '@enonic/lib-admin-ui/ui/selector/list/SelectableTreeListBoxKeyNavigator';
import { TreeListBoxExpandedHolder } from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';
import { AppHelper } from '@enonic/lib-admin-ui/util/AppHelper';
import type Q from 'q';
import { $actionsNeedRefresh, clearActionsRefreshSignal } from '../../v6/app/actions.store';
import {
    removeContent,
    beginPendingFilter,
    setContent,
    hasCurrentItems,
    removeTreeNode,
    revealContentByPath,
} from '../../v6/entities/content';
import { onActiveProjectChanged, onNoProjectsAvailable } from '../../v6/entities/project';
import { $contextPanelMode } from '../../v6/shared/app-state/browsePanels.store';
import { setDependencySearchPending } from '../../v6/features/search/model/contentFilter.store';
import { ContentTreeListElement } from '../../v6/widgets/browse-grid/ContentTreeListElement';
import { executeBrowseAction } from '../../v6/pages/browse/model/browseActions.commands';
import { setBrowseActionsStashed } from '../../v6/pages/browse/model/browseActions.store';
import { BrowseToolbarElement } from '../../v6/pages/browse/ui/BrowseToolbar';
import { BrowseTreeContextMenu } from '../../v6/pages/browse/ui/BrowseTreeContextMenu';
import { type ContentId } from '../content/ContentId';
import { type ContentQuery } from '../content/ContentQuery';
import { ContentSummaryBuilder } from '../content/ContentSummary';
import { ContentSummaryAndCompareStatus } from '../content/ContentSummaryAndCompareStatus';
import { type ContentServerChangeItem } from '../event/ContentServerChangeItem';
import { ContentServerEventsHandler } from '../event/ContentServerEventsHandler';
import { EditContentEvent } from '../event/EditContentEvent';
import { type ContentTreeSelectorItem } from '../item/ContentTreeSelectorItem';
import { RenderingMode } from '../rendering/RenderingMode';
import { UriHelper } from '../rendering/UriHelper';
import { GetContentSummaryByIdRequest } from '../resource/GetContentSummaryByIdRequest';
import { Router } from '../Router';
import { UrlAction } from '../UrlAction';
import { type ContentItemPreviewPanel } from '../view/ContentItemPreviewPanel';
import { ContentBrowseItemPanel } from './ContentBrowseItemPanel';
import { ContentBrowsePanelKeyNavigator } from './ContentBrowsePanelKeyNavigator';
import { ContentBrowseToolbar } from './ContentBrowseToolbar';
import { type ContentsTreeGridList, type ContentsTreeGridListElement } from './ContentsTreeGridList';
import { ContentsTreeGridRootList } from './ContentsTreeGridRootList';
import { ContentTreeListSelectablePanelProxy } from './ContentTreeListSelectablePanelProxy';
import { DeletedContentItem } from './DeletedContentItem';
import { ContentBrowseFilterPanel } from './filter/ContentBrowseFilterPanel';
import { type MovedContentItem } from './MovedContentItem';
import { ResponsiveBrowsePanel } from './ResponsiveBrowsePanel';
import { SearchAndExpandItemEvent } from './SearchAndExpandItemEvent';
import { State } from './State';
import { ToggleSearchPanelEvent } from './ToggleSearchPanelEvent';
import { ToggleSearchPanelWithDependenciesEvent } from './ToggleSearchPanelWithDependenciesEvent';
import { createHostBus, type HostBus } from '@enonic/page-editor/protocol';

export class ContentBrowsePanel extends ResponsiveBrowsePanel {
    declare protected browseToolbar: ContentBrowseToolbar;
    declare protected filterPanel: ContentBrowseFilterPanel;
    private debouncedFilterRefresh: () => void;
    private debouncedBrowseActionsAndPreviewRefreshOnDemand: () => void;
    private browseActionsAndPreviewUpdateRequired: boolean = false;

    private state: State;

    protected treeListBox: ContentsTreeGridRootList;

    protected toolbar: ListBoxToolbar<ContentTreeSelectorItem>;

    protected selectionWrapper: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>;

    declare protected selectableListBoxPanel: SelectableListBoxPanel<ContentSummaryAndCompareStatus>;

    protected expandedContext: TreeListBoxExpandedHolder;

    private contentTreeList: ContentTreeListElement;

    private previewBus?: HostBus;
    private pendingDependencySearchCleanup?: () => void;

    protected initElements() {
        super.initElements();

        (this.selectableListBoxPanel as ContentTreeListSelectablePanelProxy).setMobileDependenciesSection(
            this.filterPanel.getMobileDependenciesSection(),
        );

        this.prependChild(new BrowseToolbarElement());

        this.debouncedFilterRefresh = AppHelper.debounce(this.refreshFilter.bind(this), 1000);
        this.debouncedBrowseActionsAndPreviewRefreshOnDemand = AppHelper.debounce(() => {
            if (this.browseActionsAndPreviewUpdateRequired) {
                this.updateActionsAndPreview();
            }
        }, 300);
    }

    private handleProjectNotSet() {
        this.toggleFilterPanelAction.setEnabled(false);
        this.setContentTreeState(State.DISABLED);

        let unsubscribeProjectSetHandler = () => undefined;
        const projectSetHandler = () => {
            this.toggleFilterPanelAction.setEnabled(true);
            this.setContentTreeState(State.ENABLED);
            Router.get().setHash(UrlAction.BROWSE);
            unsubscribeProjectSetHandler();
        };

        unsubscribeProjectSetHandler = onActiveProjectChanged(projectSetHandler);
    }

    protected initListeners() {
        super.initListeners();

        this.bindPreviewBus();

        this.filterPanel.onSearchEvent((query?: ContentQuery) => {
            this.contentTreeList.setFilterQuery(query, this.filterPanel.getTargetBranch());
        });

        this.filterPanel.onDependencyRemoved(() => {
            if (this.clearPendingDependencySearch()) {
                this.contentTreeList.setFilterQuery(null);
                this.hideFilterPanel();
            }
        });

        this.onRemoved(() => this.cancelPendingDependencySearch());

        this.handleGlobalEvents();

        this.treeListBox.onItemsAdded(
            (items: ContentSummaryAndCompareStatus[], itemViews: ContentsTreeGridListElement[]) => {
                items.forEach((item: ContentSummaryAndCompareStatus, index) => {
                    const listElement = itemViews[index]?.getDataView();

                    listElement?.onDblClicked((event: MouseEvent) => {
                        const target = event.target;

                        if (target instanceof HTMLElement && target.classList.contains('toggle')) {
                            return;
                        }

                        new EditContentEvent([item]).fire();
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
            },
        );

        this.selectionWrapper.whenRendered(() => {
            this.treeListBox.load();
        });
    }

    createListBoxPanel(): SelectableListBoxPanel<ContentSummaryAndCompareStatus> {
        this.expandedContext = new TreeListBoxExpandedHolder();
        this.treeListBox = new ContentsTreeGridRootList({ scrollParent: this, expandedContext: this.expandedContext });

        this.selectionWrapper = new SelectableListBoxWrapper<ContentSummaryAndCompareStatus>(this.treeListBox, {
            className: 'content-list-box-wrapper content-tree-grid',
            maxSelected: 0,
            checkboxPosition: 'left',
            highlightMode: true,
        });

        this.toolbar = new ListBoxToolbar<ContentSummaryAndCompareStatus>(this.selectionWrapper, {
            refreshAction: () => this.treeListBox.reload(),
        });

        this.contentTreeList = new ContentTreeListElement({
            contextMenu: BrowseTreeContextMenu,
            onEdit: () => executeBrowseAction('edit'),
        });

        const panel = new ContentTreeListSelectablePanelProxy(
            this.selectionWrapper,
            this.contentTreeList,
            this.toolbar,
        );
        panel.addClass('content-selectable-list-box-panel');

        return panel;
    }

    protected createKeyNavigator(): SelectableTreeListBoxKeyNavigator<ContentSummaryAndCompareStatus> {
        return new ContentBrowsePanelKeyNavigator(this.selectionWrapper);
    }

    getActions(): Action[] {
        return [...super.getActions(), ...this.getPreviewPanel().getActions()];
    }

    protected createToolbar(): ContentBrowseToolbar {
        return new ContentBrowseToolbar();
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
        this.filterPanel.setSelectedItems(this.selectableListBoxPanel.getSelectedItems().map((item) => item.getId()));
    }

    protected enableSelectionMode() {
        this.filterPanel.setSelectedItems(this.selectableListBoxPanel.getSelectedItems().map((item) => item.getId()));
    }

    protected disableSelectionMode() {
        this.filterPanel.resetConstraints();
        this.hideFilterPanel();
        super.disableSelectionMode();
        this.contentTreeList.setFilterQuery(null);
    }

    doRender(): Q.Promise<boolean> {
        return super
            .doRender()
            .then((rendered) => {
                this.addClass('content-browse-panel');

                return rendered;
            })
            .catch((error) => {
                console.error("Couldn't render ContentBrowsePanel", error);
                return true;
            });
    }

    private handleGlobalEvents() {
        ManagedActionManager.instance().onManagedActionStateChanged((state: ManagedActionState) => {
            if (state === ManagedActionState.PREPARING) {
                setBrowseActionsStashed(true);
            } else if (state === ManagedActionState.ENDED) {
                setBrowseActionsStashed(false);
            }
        });

        ToggleSearchPanelEvent.on(() => {
            if (this.pendingDependencySearchCleanup) {
                this.cancelPendingDependencySearch();
                return;
            }
            this.toggleFilterPanel();
        });

        ToggleSearchPanelWithDependenciesEvent.on((event: ToggleSearchPanelWithDependenciesEvent) => {
            this.showDependencies(event);
        });

        SearchAndExpandItemEvent.on((event: SearchAndExpandItemEvent) => {
            this.cancelPendingDependencySearch();
            const contentId: ContentId = event.getContentId();

            if (this.toolbar.getSelectionPanelToggler().isActive()) {
                this.toolbar.getSelectionPanelToggler().setActive(false);
            }

            this.showFilterPanel();
            this.filterPanel.searchItemById(contentId);
        });

        this.subscribeOnContentEvents();

        // Subscribe to nanostores action refresh signal (v6 socket events)
        // Triggered when selected content is updated via socket (publish, update, permissions)
        $actionsNeedRefresh.subscribe((timestamp) => {
            if (timestamp === 0) return;
            clearActionsRefreshSignal();
            this.handleCUD();
        });

        RepositoryEvent.on((event) => {
            if (event.isRestored()) {
                this.treeListBox.reload();
            }
        });

        onActiveProjectChanged(() => {
            this.cancelPendingDependencySearch();
            this.selectionWrapper.deselectAll();
            this.updateActionsAndPreview();
            this.filterPanel.reset().then(() => {
                this.hideFilterPanel();
                this.toggleFilterPanelButton.removeClass('filtered');
            });
        });

        onNoProjectsAvailable(() => {
            this.handleProjectNotSet();
            this.selectionWrapper.deselectAll(true);
            this.treeListBox.clearItems(true);
        });
    }

    private showDependencies(event: ToggleSearchPanelWithDependenciesEvent): void {
        this.cancelPendingDependencySearch();

        if (this.toolbar.getSelectionPanelToggler().isActive()) {
            this.toolbar.getSelectionPanelToggler().setActive(false);
        }

        const isMobile = $contextPanelMode.get() === 'mobile';
        if (isMobile) {
            beginPendingFilter();
            setDependencySearchPending(true);
        }

        this.showFilterPanel();
        this.filterPanel.setTargetBranch(event.getBranch());
        this.filterPanel.setDependencyItem(event.getContent(), event.isInbound(), event.getType());

        if (isMobile) {
            const requestId = this.filterPanel.getDependencyRequestId();
            const showResults = (query?: ContentQuery, completedRequestId?: number) => {
                if (completedRequestId !== requestId) {
                    return;
                }

                if (query) {
                    this.hideFilterPanel();
                }
                this.clearPendingDependencySearch();
            };
            const cancelOnNavigation = () => this.cancelPendingDependencySearch();

            this.filterPanel.onSearchEvent(showResults);
            window.addEventListener('hashchange', cancelOnNavigation);
            this.pendingDependencySearchCleanup = () => {
                this.filterPanel.unSearchEvent(showResults);
                window.removeEventListener('hashchange', cancelOnNavigation);
                setDependencySearchPending(false);
            };
        }
    }

    private clearPendingDependencySearch(): boolean {
        if (!this.pendingDependencySearchCleanup) {
            return false;
        }

        this.pendingDependencySearchCleanup();
        this.pendingDependencySearchCleanup = undefined;
        return true;
    }

    private cancelPendingDependencySearch(): void {
        if (!this.clearPendingDependencySearch()) {
            return;
        }

        this.filterPanel.cancelDependencyRequest();
        this.contentTreeList.setFilterQuery(null);
        this.hideFilterPanel();
    }

    // Scopes a protocol host bus to the inline-preview iframe (which renders via
    // `@enonic/page-editor`'s viewer). The viewer posts `preview-path-changed`
    // on link clicks; the bus is recreated on every iframe load and pinned to
    // the iframe's origin.
    private bindPreviewBus(): void {
        const iframe = this.getPreviewPanel().getIFrameEl();

        iframe.onLoaded(() => {
            this.previewBus?.destroy();
            this.previewBus = undefined;

            const previewWindow = (iframe.getHTMLElement() as HTMLIFrameElement).contentWindow;
            if (!previewWindow) {
                return;
            }

            const src = (iframe.getHTMLElement() as HTMLIFrameElement).src;
            const remoteOrigin = src ? new URL(src, window.location.href).origin : window.location.origin;

            this.previewBus = createHostBus({ remote: previewWindow, remoteOrigin });
            this.previewBus.on('preview-path-changed', (payload) => {
                this.selectInlinedContentInGrid(payload.path);
            });
        });
    }

    private selectInlinedContentInGrid(contentInlinePath: string): void {
        const path = this.getPathFromInlinePath(contentInlinePath);
        if (!path) return;

        // Suppress the redundant preview reload the resulting selection change would
        // trigger: the iframe already navigated to this content.
        void revealContentByPath(path, {
            onBeforeSelect: () => this.getPreviewPanel().setSkipNextSetItemCall(true),
        });
    }

    private getPathFromInlinePath(contentPreviewPath: string): string {
        // if contentPreviewPath is a portal uri, get the content path from it,
        // otherwise assume it's a content path (i.e. came from 3rd party rendering engines)
        return UriHelper.getPathFromPortalInlineUri(contentPreviewPath, RenderingMode.INLINE) || contentPreviewPath;
    }

    private subscribeOnContentEvents() {
        const handler: ContentServerEventsHandler = ContentServerEventsHandler.getInstance();

        handler.onContentCreated((data: ContentSummaryAndCompareStatus[]) => this.handleContentCreated(data));

        handler.onContentUpdated((data: ContentSummaryAndCompareStatus[]) => this.handleContentUpdated(data));

        handler.onContentRenamed((data: ContentSummaryAndCompareStatus[]) => {
            this.handleContentRenamed(data);
        });

        handler.onContentDeleted((data: ContentServerChangeItem[]) => {
            this.handleContentDeleted(
                data.map(
                    (item: ContentServerChangeItem) => new DeletedContentItem(item.getContentId(), item.getPath()),
                ),
            );
        });

        handler.onContentPublished((data: ContentSummaryAndCompareStatus[]) => this.handleContentPublished(data));

        handler.onContentUnpublished((data: ContentSummaryAndCompareStatus[]) => this.handleContentUnpublished(data));

        handler.onContentDuplicated((data: ContentSummaryAndCompareStatus[]) => this.handleContentCreated(data));

        handler.onContentMoved((movedItems: MovedContentItem[]) => {
            let movedToOtherParentItems: MovedContentItem[] = [];
            let renamedItems: MovedContentItem[] = [];

            movedItems.forEach((movedItem: MovedContentItem) => {
                if (movedItem.oldPath.getParentPath().equals(movedItem.item.getPath().getParentPath())) {
                    renamedItems.push(movedItem);
                } else {
                    movedToOtherParentItems.push(movedItem);
                }
            });

            if (movedToOtherParentItems.length > 0) {
                this.handleContentDeleted(
                    movedToOtherParentItems.map(
                        (item: MovedContentItem) => new DeletedContentItem(item.item.getContentId(), item.oldPath),
                    ),
                );
                this.handleContentCreated(movedToOtherParentItems.map((item: MovedContentItem) => item.item));
            }

            if (renamedItems.length > 0) {
                this.handleContentRenamed(renamedItems.map((renamedItem) => renamedItem.item));
            }
        });
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
        this.treeListBox.findParentLists(item).forEach((list) => {
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
            const newContSummAndCompStatus = ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(
                newContSumm,
                listItem.getCompareStatus(),
                listItem.getPublishStatus(),
            );
            list.getParentList().replaceItems(newContSummAndCompStatus);
        }
    }

    private handleContentRenamed(data: ContentSummaryAndCompareStatus[]) {
        data.forEach((item: ContentSummaryAndCompareStatus) => {
            this.treeListBox.findParentLists(item).forEach((list) => list.replaceItems(item));
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

    private handleContentDeleted(items: DeletedContentItem[]) {
        if (ContentBrowsePanel.debug) {
            console.debug(
                'ContentBrowsePanel: deleted',
                items.map((i) => i.id.toString()),
            );
        }

        this.handleCUD();
        this.deleteTreeItems(items);

        items.forEach((i) => {
            const id = i.id.toString();
            removeContent(id);
            removeTreeNode(id);
        });

        this.refreshFilterWithDelay();
    }

    private deleteTreeItems(toDeleteItems: DeletedContentItem[]): void {
        const itemsToDeselect = toDeleteItems.map((toDeleteItem) =>
            ContentSummaryAndCompareStatus.fromContentSummary(
                new ContentSummaryBuilder().setId(toDeleteItem.id.toString()).build(),
            ),
        );
        this.selectionWrapper.deselect(itemsToDeselect);

        const filteredChildren = toDeleteItems.filter((toDeleteItem) => {
            return !toDeleteItems.some((item) => toDeleteItem.path.isDescendantOf(item.path));
        });

        filteredChildren.forEach((toDeleteItem) => {
            this.deleteItemAndUpdateParentsLists(toDeleteItem);
        });
    }

    private deleteItemAndUpdateParentsLists(toDeleteItem: DeletedContentItem): void {
        this.treeListBox.findParentLists(toDeleteItem.path).forEach((parentList) => {
            if (parentList.wasAlreadyShownAndLoaded()) {
                this.removeItemFromParentList(parentList, toDeleteItem);
            }

            this.updateParentListHasChildren(parentList);
        });
    }

    private removeItemFromParentList(parentList: ContentsTreeGridList, toDeleteItem: DeletedContentItem): void {
        const itemInList = parentList.getItems().find((item) => item.getContentId().equals(toDeleteItem.id));

        if (itemInList) {
            parentList.removeItems(itemInList);
        }
    }

    private updateParentListHasChildren(parentList: ContentsTreeGridList): void {
        const parentItem = parentList.getParentItem();

        if (!parentItem) {
            return;
        }

        new GetContentSummaryByIdRequest(parentItem.getContentId())
            .sendAndParse()
            .then((updatedItem) => {
                if (!updatedItem.hasChildren()) {
                    const newContSumm = new ContentSummaryBuilder(updatedItem).build();
                    const newContSummAndCompStatus =
                        ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(
                            newContSumm,
                            parentItem.getCompareStatus(),
                            parentItem.getPublishStatus(),
                        );
                    parentList.getParentList().replaceItems(newContSummAndCompStatus);
                }
            })
            .catch(DefaultErrorHandler.handle);
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

        data.forEach((newItem: ContentSummaryAndCompareStatus) => {
            setContent(newItem.getContentSummary());
        });

        this.refreshFilterWithDelay();
    }

    private getPreviewPanel(): ContentItemPreviewPanel {
        return this.getBrowseItemPanel().getItemStatisticsPanel().getPreviewPanel();
    }

    getBrowseItemPanel(): ContentBrowseItemPanel {
        return super.getBrowseItemPanel() as ContentBrowseItemPanel;
    }

    private handleCUD() {
        if (hasCurrentItems()) {
            this.browseActionsAndPreviewUpdateRequired = true;
            this.debouncedBrowseActionsAndPreviewRefreshOnDemand();
        }
    }

    protected updateActionsAndPreview(): void {
        this.browseActionsAndPreviewUpdateRequired = false;

        super.updateActionsAndPreview();
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
}
