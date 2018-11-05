import {ContentTreeGridActions} from './action/ContentTreeGridActions';
import {ContentBrowseToolbar} from './ContentBrowseToolbar';
import {ContentTreeGrid} from './ContentTreeGrid';
import {ContentBrowseFilterPanel} from './filter/ContentBrowseFilterPanel';
import {ContentBrowseItemPanel} from './ContentBrowseItemPanel';
import {ContentItemStatisticsPanel} from '../view/ContentItemStatisticsPanel';
import {Router} from '../Router';
import {ActiveDetailsPanelManager} from '../view/detail/ActiveDetailsPanelManager';
import {ContentBrowseItem} from './ContentBrowseItem';
import {ToggleSearchPanelEvent} from './ToggleSearchPanelEvent';
import {ToggleSearchPanelWithDependenciesEvent} from './ToggleSearchPanelWithDependenciesEvent';
import {NewMediaUploadEvent} from '../create/NewMediaUploadEvent';
import {ContentPreviewPathChangedEvent} from '../view/ContentPreviewPathChangedEvent';
import {ContentPublishMenuButton} from './ContentPublishMenuButton';
import {TreeNodeParentOfContent} from './TreeNodeParentOfContent';
import {TreeNodesOfContentPath} from './TreeNodesOfContentPath';
import {DetailsSplitPanel} from '../view/detail/DetailsSplitPanel';
import {RenderingMode} from '../rendering/RenderingMode';
import {UriHelper} from '../rendering/UriHelper';
import {IsRenderableRequest} from '../resource/IsRenderableRequest';
import {ContentHelper} from '../util/ContentHelper';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {GetContentByIdRequest} from '../resource/GetContentByIdRequest';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {Branch} from '../versioning/Branch';
import {Content} from '../content/Content';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import TreeNode = api.ui.treegrid.TreeNode;
import BrowseItem = api.app.browse.BrowseItem;
import UploadItem = api.ui.uploader.UploadItem;
import ContentSummary = api.content.ContentSummary;
import ResponsiveManager = api.ui.responsive.ResponsiveManager;
import ResponsiveRanges = api.ui.responsive.ResponsiveRanges;
import ResponsiveItem = api.ui.responsive.ResponsiveItem;
import ContentPath = api.content.ContentPath;
import DataChangedEvent = api.ui.treegrid.DataChangedEvent;
import TreeGridItemClickedEvent = api.ui.treegrid.TreeGridItemClickedEvent;
import ContentIconUrlResolver = api.content.util.ContentIconUrlResolver;
import RepositoryEvent = api.content.event.RepositoryEvent;
import ContentServerChangeItem = api.content.event.ContentServerChangeItem;

export class ContentBrowsePanel
    extends api.app.browse.BrowsePanel<ContentSummaryAndCompareStatus> {

    protected treeGrid: ContentTreeGrid;
    protected browseToolbar: ContentBrowseToolbar;
    protected filterPanel: ContentBrowseFilterPanel;
    private detailsSplitPanel: DetailsSplitPanel;
    private debouncedPreviewRefresh: () => void;

    constructor() {

        super();

        this.onShown(() => {
            Router.setHash('browse');
        });

        ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => {
            this.getBrowseActions().getToggleSearchPanelAction().setVisible(item.isInRangeOrSmaller(ResponsiveRanges._540_720));
        });

        this.getBrowseActions().updateActionsEnabledState([]); // to enable/disable actions correctly

        this.handleGlobalEvents();

        this.debouncedPreviewRefresh = api.util.AppHelper.debounce(() => this.forcePreviewRerender(), 500);
    }

    protected checkIfItemIsRenderable(browseItem: ContentBrowseItem): wemQ.Promise<any> {
        let previewHandler = this.getBrowseActions().getPreviewHandler();
        return previewHandler.checkIfItemIsRenderable(browseItem);
    }

    protected getBrowseActions(): ContentTreeGridActions {
        return <ContentTreeGridActions>super.getBrowseActions();
    }

    getNonToolbarActions(): api.ui.Action[] {
        return this.getBrowseActions().getPublishActions();
    }

    protected createToolbar(): ContentBrowseToolbar {
        return new ContentBrowseToolbar(this.getBrowseActions());
    }

    protected createTreeGrid(): ContentTreeGrid {
        let treeGrid = new ContentTreeGrid();

        treeGrid.onDataChanged((event: api.ui.treegrid.DataChangedEvent<ContentSummaryAndCompareStatus>) => {
            if (event.getType() === 'updated') {
                let browseItems = this.treeNodesToBrowseItems(event.getTreeNodes());
                this.getBrowseItemPanel().updateItems(browseItems);
                this.getBrowseActions().updateActionsEnabledState(this.treeNodesToBrowseItems(this.treeGrid.getRoot().getFullSelection()));
            }
        });

        return treeGrid;
    }

    protected createBrowseItemPanel(): ContentBrowseItemPanel {
        return new ContentBrowseItemPanel();
    }

    protected createFilterPanel(): ContentBrowseFilterPanel {
        let filterPanel = new ContentBrowseFilterPanel();

        let showMask = () => {
            if (this.isVisible()) {
                this.treeGrid.mask();
            }
        };

        filterPanel.onSearchStarted(showMask);
        filterPanel.onRefreshStarted(showMask);

        return filterPanel;
    }

    protected updateFilterPanelOnSelectionChange() {
        this.filterPanel.setSelectedItems(this.treeGrid.getSelectedDataList());
    }

    protected enableSelectionMode() {
        this.filterPanel.setSelectedItems(this.treeGrid.getSelectedDataList());
    }

    protected disableSelectionMode() {
        this.filterPanel.resetConstraints();
        this.hideFilterPanel();
        super.disableSelectionMode();
    }

    doRender(): wemQ.Promise<boolean> {
        return super.doRender().then((rendered) => {

            const browseActions = this.getBrowseActions();
            const mobileActions = [
                browseActions.getUnpublishAction(),
                browseActions.getPublishAction(),
                browseActions.getMoveAction(),
                browseActions.getSortAction(),
                browseActions.getDeleteAction(),
                browseActions.getDuplicateAction(),
                browseActions.getEditAction(),
                browseActions.getShowNewDialogAction()
            ];
            this.detailsSplitPanel = new DetailsSplitPanel(this.getFilterAndGridSplitPanel(), mobileActions);
            this.appendChild(this.detailsSplitPanel);

            this.subscribeMobilePanelOnEvents();
            this.subscribeDetailsPanelsOnEvents();
            this.createContentPublishMenuButton();

            return rendered;
        }).catch((error) => {
            console.error(`Couldn't render ContentBrowsePanel`, error);
            return true;
        });
    }

    private updateDetailsPanelOnItemChange(selection?: TreeNode<ContentSummaryAndCompareStatus>[]) {
        if (!this.detailsSplitPanel.isMobileMode()) {
            // no need to update on selection change in mobile mode as it opens in a separate screen
            let item = this.getFirstSelectedOrHighlightedBrowseItem(selection);
            this.doUpdateDetailsPanel(item ? item.getModel() : null);
        }
    }

    private subscribeDetailsPanelsOnEvents() {

        this.getTreeGrid().onSelectionChanged((currentSelection: TreeNode<ContentSummaryAndCompareStatus>[],
                                               fullSelection: TreeNode<ContentSummaryAndCompareStatus>[]) => {
            this.updateDetailsPanelOnItemChange(fullSelection);
        });

        this.getTreeGrid().onHighlightingChanged(() => {
            this.updateDetailsPanelOnItemChange();
        });
    }

    private subscribeMobilePanelOnEvents() {

        // selection opens detail panel in mobile mode, so deselect it when returning back to grid
        this.detailsSplitPanel.onMobilePanelSlide((out: boolean) => {
            if (out) {
                this.treeGrid.deselectAll();
                this.getBrowseActions().updateActionsEnabledState([]);
            }
        });

        TreeGridItemClickedEvent.on((event: TreeGridItemClickedEvent) => {
            if (this.detailsSplitPanel.isMobileMode()) {
                this.detailsSplitPanel.setContent(event.getTreeNode().getData());
                this.detailsSplitPanel.showMobilePanel();
            }
        });
    }

    // tslint:disable-next-line:max-line-length
    private getFirstSelectedOrHighlightedBrowseItem(fullSelection?: TreeNode<ContentSummaryAndCompareStatus>[]): BrowseItem<ContentSummaryAndCompareStatus> {
        const highlightedNode = this.treeGrid.getFirstSelectedOrHighlightedNode();
        if (!fullSelection && !highlightedNode) {
            return null;
        }

        let nodes = [];

        if (fullSelection && fullSelection.length > 0) {
            nodes = fullSelection;
        } else if (highlightedNode) {
            nodes = [highlightedNode];
        }

        return this.treeNodeToBrowseItem(nodes[0]);
    }

    treeNodeToBrowseItem(node: TreeNode<ContentSummaryAndCompareStatus>): ContentBrowseItem | null {
        const data = node ? node.getData() : null;
        return (!data || !data.getContentSummary()) ? null : <ContentBrowseItem>new ContentBrowseItem(data)
            .setId(data.getId())
            .setDisplayName(data.getContentSummary().getDisplayName())
            .setPath(data.getContentSummary().getPath().toString())
            .setIconUrl(new ContentIconUrlResolver().setContent(data.getContentSummary()).resolve());
    }

    treeNodesToBrowseItems(nodes: TreeNode<ContentSummaryAndCompareStatus>[]): ContentBrowseItem[] {
        let browseItems: ContentBrowseItem[] = [];

        // do not proceed duplicated content. still, it can be selected
        nodes.forEach((node: TreeNode<ContentSummaryAndCompareStatus>, index: number) => {
            let i = 0;
            // Take last in a sequence with the same id
            for (; i <= index; i++) {
                if (nodes[i].getData().getId() === node.getData().getId()) {
                    break;
                }
            }
            if (i === index) {
                const item = this.treeNodeToBrowseItem(node);
                if (item) {
                    browseItems.push(item);
                }
            }
        });

        return browseItems;
    }

    private handleGlobalEvents() {

        ToggleSearchPanelEvent.on(() => {
            this.toggleFilterPanel();
        });

        ToggleSearchPanelWithDependenciesEvent.on((event: ToggleSearchPanelWithDependenciesEvent) => {

            if (this.treeGrid.getToolbar().getSelectionPanelToggler().isActive()) {
                this.treeGrid.getToolbar().getSelectionPanelToggler().setActive(false);
            }

            this.showFilterPanel();
            this.filterPanel.setDependencyItem(event.getContent(), event.isInbound(), event.getType());
        });

        NewMediaUploadEvent.on((event) => {
            this.handleNewMediaUpload(event);
        });

        this.subscribeOnContentEvents();

        ContentPreviewPathChangedEvent.on((event: ContentPreviewPathChangedEvent) => {
            this.selectPreviewedContentInGrid(event.getPreviewPath());
        });

        RepositoryEvent.on(event => {
            if (event.isRestored()) {
                this.treeGrid.reload().then(() => {
                    const fullSelection = this.treeGrid.getRoot().getFullSelection();
                    this.updateDetailsPanelOnItemChange(fullSelection);
                });
            }
        });
    }

    private selectPreviewedContentInGrid(contentPreviewPath: string) {
        let path = this.getPathFromPreviewPath(contentPreviewPath);
        if (path) {
            let contentPath = api.content.ContentPath.fromString(path);
            if (this.treeGrid.getFirstSelectedOrHighlightedNode() && !this.isGivenPathSelectedInGrid(contentPath)) {
                this.selectContentInGridByPath(contentPath);
            }
        }
    }

    private selectContentInGridByPath(path: api.content.ContentPath) {
        this.treeGrid.selectNodeByPath(path);
    }

    private isGivenPathSelectedInGrid(path: api.content.ContentPath): boolean {
        const node = this.treeGrid.getFirstSelectedOrHighlightedNode();

        if (node) {
            const contentSummary: ContentSummaryAndCompareStatus = node.getData();
            return contentSummary.getPath().equals(path);
        }
        return false;
    }

    private getPathFromPreviewPath(contentPreviewPath: string): string {
        return UriHelper.getPathFromPortalPreviewUri(contentPreviewPath, RenderingMode.PREVIEW,
            Branch.DRAFT);
    }

    private subscribeOnContentEvents() {
        let handler = ContentServerEventsHandler.getInstance();

        handler.onContentCreated((data: ContentSummaryAndCompareStatus[]) => this.handleContentCreated(data));

        handler.onContentUpdated((data: ContentSummaryAndCompareStatus[]) => this.handleContentUpdated(data));

        handler.onContentRenamed((data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => {
            this.handleContentCreated(data, oldPaths);
        });

        handler.onContentDeleted((data: ContentServerChangeItem[]) => {
            this.handleContentDeleted(data.map(d => d.getPath()));
        });

        handler.onContentPending((data: ContentSummaryAndCompareStatus[]) => this.handleContentPending(data));

        handler.onContentDuplicated((data: ContentSummaryAndCompareStatus[]) => this.handleContentCreated(data));

        handler.onContentPublished((data: ContentSummaryAndCompareStatus[]) => this.handleContentPublished(data));

        handler.onContentUnpublished((data: ContentSummaryAndCompareStatus[]) => this.handleContentUnpublished(data));

        handler.onContentMoved((data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => {
            // combination of delete and create
            this.handleContentDeleted(oldPaths);
            this.handleContentCreated(data);
        });

        handler.onContentSorted((data: ContentSummaryAndCompareStatus[]) => this.handleContentSorted(data));
    }

    private handleContentCreated(data: ContentSummaryAndCompareStatus[], oldPaths?: ContentPath[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: created', data, oldPaths);
        }

        this.processContentCreated(data, oldPaths);
    }

    private handleContentUpdated(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: updated', data);
        }

        return this.doHandleContentUpdate(data).then((changed) => {
            this.checkIfPreviewUpdateRequired(data).then(previewUpdateRequired => {
                if (previewUpdateRequired) {
                    this.debouncedPreviewRefresh();
                }
            });

            if (!changed.length) {
                return;
            }

            return this.treeGrid.placeContentNodes(changed);
        });
    }

    private handleContentDeleted(paths: ContentPath[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: deleted', paths);
        }

        let nodes = this.treeGrid.findByPaths(paths).map(el => el.getNodes());
        let merged = [];
        // merge array of nodes arrays
        merged = merged.concat.apply(merged, nodes);

        merged.forEach((node: TreeNode<ContentSummaryAndCompareStatus>) => {
            let contentSummary = node.getData().getContentSummary();
            if (node.getData() && !!contentSummary) {
                this.doUpdateDetailsPanel(null);
            }
        });

        this.treeGrid.deleteContentNodes(merged);

        // now get unique parents and update their hasChildren
        let uniqueParents = paths.map(path => path.getParentPath()).filter((parent, index, self) => {
            return self.indexOf(parent) === index;
        });
        let parentNodes = this.treeGrid.findByPaths(uniqueParents).map(parentNode => parentNode.getNodes());
        let mergedParentNodes = [];
        mergedParentNodes = mergedParentNodes.concat.apply(mergedParentNodes, parentNodes);

        mergedParentNodes.forEach((parentNode: TreeNode<ContentSummaryAndCompareStatus>) => {
            if (parentNode.getChildren().length === 0) {
                // update parent if all children were deleted
                this.treeGrid.refreshNodeData(parentNode);
            }
        });

        this.setRefreshOfFilterRequired();
        window.setTimeout(() => {
            this.refreshFilter();
        }, 1000);
    }

    private handleContentPending(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: pending', data);
        }
        this.doHandleContentUpdate(data);
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

    private processContentCreated(data: ContentSummaryAndCompareStatus[], oldPaths?: ContentPath[]) {

        let paths: api.content.ContentPath[] = data.map(d => d.getContentSummary().getPath());
        let createResult: TreeNodesOfContentPath[] = this.treeGrid.findByPaths(paths, true);
        let parentsOfContents: TreeNodeParentOfContent[] = [];

        for (let i = 0; i < createResult.length; i++) {

            let dataToHandle: ContentSummaryAndCompareStatus[] = [];

            data.forEach((el) => {

                if (el.getContentSummary().getPath().isChildOf(createResult[i].getPath())) {

                    if (oldPaths && oldPaths.length > 0) {
                        let movedNodes: TreeNode<ContentSummaryAndCompareStatus>[] = [];
                        let renameResult: TreeNodesOfContentPath[] = this.treeGrid.findByPaths(oldPaths);
                        let premerged = renameResult.map((curRenameResult) => {
                            return curRenameResult.getNodes();
                        });
                        // merge array of nodes arrays
                        movedNodes = movedNodes.concat.apply(movedNodes, premerged);

                        movedNodes.forEach((node) => {
                            if (node.getDataId() === el.getId()) {
                                node.setData(el);
                                node.clearViewers();
                                this.treeGrid.updatePathsInChildren(node);
                            }
                        });
                        this.treeGrid.placeContentNodes(movedNodes);
                    } else {
                        dataToHandle.push(el);
                    }
                }
            });

            createResult[i].getNodes().map((node) => {
                parentsOfContents.push(new TreeNodeParentOfContent(dataToHandle, node));
            });
        }

        this.treeGrid.appendContentNodes(parentsOfContents).then((results: TreeNode<ContentSummaryAndCompareStatus>[]) => {
            let appendedNodesThatShouldBeVisible = [];
            results.forEach((appendedNode) => {
                if (appendedNode.getParent() && appendedNode.getParent().isExpanded()) {
                    appendedNodesThatShouldBeVisible.push(appendedNode);
                }
            });

            this.treeGrid.placeContentNodes(appendedNodesThatShouldBeVisible).then(() => {
                this.treeGrid.initAndRender();

                this.setRefreshOfFilterRequired();
                window.setTimeout(() => {
                    this.refreshFilter();
                }, 1000);
            });
        });
    }

    private doHandleContentUpdate(data: ContentSummaryAndCompareStatus[]): wemQ.Promise<TreeNode<ContentSummaryAndCompareStatus>[]> {
        let changed = this.updateNodes(data);

        this.updateDetailsPanel(data);

        if (!changed.length) {
            return wemQ(changed);
        }

        // Update since CompareStatus changed
        return ContentSummaryAndCompareStatusFetcher.updateReadOnly(changed.map(node => node.getData())).then(() => {

            let changedEvent = new DataChangedEvent<ContentSummaryAndCompareStatus>(changed, DataChangedEvent.UPDATED);
            this.treeGrid.notifyDataChanged(changedEvent);

            return changed;
        });
    }

    private updateNodes(data: ContentSummaryAndCompareStatus[]): TreeNode<ContentSummaryAndCompareStatus>[] {
        let paths: api.content.ContentPath[] = data.map(d => d.getContentSummary().getPath());
        let treeNodes: TreeNodesOfContentPath[] = this.treeGrid.findByPaths(paths);

        let changed = [];
        data.forEach((el) => {
            for (let i = 0; i < treeNodes.length; i++) {
                if (treeNodes[i].getId() === el.getId()) {
                    treeNodes[i].updateNodeData(el);
                    changed.push(...treeNodes[i].getNodes());
                    break;
                }
            }
        });

        return changed;
    }

    private handleContentSorted(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: sorted', data);
        }
        let paths: api.content.ContentPath[] = data.map(d => d.getContentSummary().getPath());
        let sortResult: TreeNodesOfContentPath[] = this.treeGrid.findByPaths(paths);

        let nodes = sortResult.map((el) => {
            return el.getNodes();
        });
        let merged = [];
        // merge array of nodes arrays
        merged = merged.concat.apply(merged, nodes);

        this.treeGrid.sortNodesChildren(merged).then(() => this.treeGrid.invalidate());
    }

    private handleNewMediaUpload(event: NewMediaUploadEvent) {
        event.getUploadItems().forEach((item: UploadItem<ContentSummary>) => {
            this.treeGrid.appendUploadNode(item);
        });
    }

    private checkIfPreviewUpdateRequired(updatedContents: ContentSummaryAndCompareStatus[]): wemQ.Promise<boolean> {
        let previewItem = this.getBrowseItemPanel().getStatisticsItem();
        let previewRefreshRequired = false;

        if (!previewItem) {
            return wemQ(false);
        }

        return new GetContentByIdRequest(previewItem.getModel().getContentId()).sendAndParse().then((previewItemContent: Content) => {

            let promises: wemQ.Promise<void>[] = [];

            updatedContents.some((content: ContentSummaryAndCompareStatus) => {
                if (content.getPath().equals(previewItem.getModel().getPath())) {
                    new IsRenderableRequest(content.getContentId()).sendAndParse().then((renderable: boolean) => {
                        this.getBrowseItemPanel().setStatisticsItem(this.toBrowseItem(content, renderable));
                    });
                    previewRefreshRequired = true;
                }

                if (content.getContentSummary().isPageTemplate()) {
                    previewRefreshRequired = true;
                }

                if (!previewRefreshRequired) {
                    promises.push(
                        ContentHelper.containsChildContentId(previewItemContent, content.getContentId()).then((containsId: boolean) => {
                        if (containsId) {
                            previewRefreshRequired = true;
                        }
                    }));
                }
                return previewRefreshRequired;
            });

            return wemQ.all(promises);

        }).then(() => {
            if (!previewRefreshRequired) {
                return wemQ.all(
                    updatedContents.map(updatedContent =>
                        ContentHelper.isReferencedBy(updatedContent.getContentSummary(), previewItem.getModel().getContentId()))
                ).then((results: boolean[]) => results.some(result => result));
            } else {
                return wemQ(previewRefreshRequired);
            }
        });
    }

    private toBrowseItem(content: ContentSummaryAndCompareStatus, renderable: boolean): BrowseItem<ContentSummaryAndCompareStatus> {
        return <BrowseItem<ContentSummaryAndCompareStatus>>new BrowseItem<ContentSummaryAndCompareStatus>(content)
            .setId(content.getId())
            .setDisplayName(content.getDisplayName()).setPath(content.getPath().toString())
            .setIconUrl(new ContentIconUrlResolver().setContent(content.getContentSummary()).resolve())
            .setRenderable(renderable);
    }

    private forcePreviewRerender() {
        let previewItem = this.getBrowseItemPanel().getStatisticsItem();
        (<ContentItemStatisticsPanel>this.getBrowseItemPanel().getItemStatisticsPanel()).getPreviewPanel().setItem(previewItem, true);

        this.detailsSplitPanel.setMobilePreviewItem(previewItem, true);
    }

    private updateDetailsPanel(data: ContentSummaryAndCompareStatus[]) {
        let detailsPanel = ActiveDetailsPanelManager.getActiveDetailsPanel();
        let itemInDetailPanel = detailsPanel ? detailsPanel.getItem() : null;

        if (!itemInDetailPanel) {
            return;
        }

        let content: ContentSummaryAndCompareStatus;
        let itemInDetailsPanelUpdated = data.some((contentItem: ContentSummaryAndCompareStatus) => {
            if (contentItem.getId() === itemInDetailPanel.getId()) {
                content = contentItem;
                return true;
            }
        });

        if (itemInDetailsPanelUpdated) {
            this.doUpdateDetailsPanel(content);
        }
    }

    private doUpdateDetailsPanel(item: ContentSummaryAndCompareStatus) {
        let detailsPanel = ActiveDetailsPanelManager.getActiveDetailsPanel();
        if (detailsPanel) {
            detailsPanel.setItem(item);
        }
    }

    getBrowseItemPanel(): ContentBrowseItemPanel {
        return <ContentBrowseItemPanel>super.getBrowseItemPanel();
    }

    private createContentPublishMenuButton() {
        const browseActions = this.getBrowseActions();
        let contentPublishMenuButton = new ContentPublishMenuButton({
            publishAction: browseActions.getPublishAction(),
            publishTreeAction: browseActions.getPublishTreeAction(),
            unpublishAction: browseActions.getUnpublishAction(),
            createIssueAction: browseActions.getCreateIssueAction()
        });

        this.detailsSplitPanel.onMobileModeChanged((isMobile: boolean) => {
            if (isMobile) {
                contentPublishMenuButton.minimize();
            } else {
                contentPublishMenuButton.maximize();
            }
        });

        this.treeGrid.onSelectionChanged(
            (currentSel: TreeNode<ContentSummaryAndCompareStatus>[], fullSel: TreeNode<ContentSummaryAndCompareStatus>[],
             highlighted: boolean) => {
                return contentPublishMenuButton.setItem(fullSel.length === 1 ? fullSel[0].getData() : null);
            });

        this.treeGrid.onHighlightingChanged(
            (item: TreeNode<ContentSummaryAndCompareStatus>) => contentPublishMenuButton.setItem(item ? item.getData() : null));

        this.browseToolbar.appendChild(contentPublishMenuButton);
    }
}
