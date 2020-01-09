import * as Q from 'q';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from 'lib-admin-ui/ui/responsive/ResponsiveItem';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {ContentTreeGridActions} from './action/ContentTreeGridActions';
import {ContentBrowseToolbar} from './ContentBrowseToolbar';
import {ContentTreeGrid} from './ContentTreeGrid';
import {ContentBrowseFilterPanel} from './filter/ContentBrowseFilterPanel';
import {ContentBrowseItemPanel} from './ContentBrowseItemPanel';
import {ContentItemStatisticsPanel} from '../view/ContentItemStatisticsPanel';
import {Router} from '../Router';
import {ActiveContextPanelManager} from '../view/context/ActiveContextPanelManager';
import {ContentBrowseItem} from './ContentBrowseItem';
import {ToggleSearchPanelEvent} from './ToggleSearchPanelEvent';
import {ToggleSearchPanelWithDependenciesEvent} from './ToggleSearchPanelWithDependenciesEvent';
import {NewMediaUploadEvent} from '../create/NewMediaUploadEvent';
import {ContentPreviewPathChangedEvent} from '../view/ContentPreviewPathChangedEvent';
import {ContextSplitPanel} from '../view/context/ContextSplitPanel';
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
import {RepositoryId} from '../repository/RepositoryId';
import {ContentBrowsePublishMenuButton} from './ContentBrowsePublishMenuButton';
import {ContextPanel} from '../view/context/ContextPanel';
import {PreviewContentHandler} from './action/handler/PreviewContentHandler';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {BrowseItem} from 'lib-admin-ui/app/browse/BrowseItem';
import {UploadItem} from 'lib-admin-ui/ui/uploader/UploadItem';
import {ResponsiveRanges} from 'lib-admin-ui/ui/responsive/ResponsiveRanges';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {DataChangedEvent, DataChangedType} from 'lib-admin-ui/ui/treegrid/DataChangedEvent';
import {TreeGridItemClickedEvent} from 'lib-admin-ui/ui/treegrid/TreeGridItemClickedEvent';
import {ContentIconUrlResolver} from 'lib-admin-ui/content/util/ContentIconUrlResolver';
import {RepositoryEvent} from 'lib-admin-ui/content/event/RepositoryEvent';
import {ContentServerChangeItem} from 'lib-admin-ui/content/event/ContentServerChange';
import {SplitPanel} from 'lib-admin-ui/ui/panel/SplitPanel';
import {Action} from 'lib-admin-ui/ui/Action';
import {ViewItem} from 'lib-admin-ui/app/view/ViewItem';
import {BrowsePanel} from 'lib-admin-ui/app/browse/BrowsePanel';
import {BrowserHelper} from 'lib-admin-ui/BrowserHelper';
import {ContentIds} from '../ContentIds';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';

export class ContentBrowsePanel
    extends BrowsePanel<ContentSummaryAndCompareStatus> {

    protected treeGrid: ContentTreeGrid;
    protected browseToolbar: ContentBrowseToolbar;
    protected filterPanel: ContentBrowseFilterPanel;
    private contextSplitPanel: ContextSplitPanel;
    private debouncedPreviewRefresh: () => void;

    constructor() {

        super();

        this.onShown(() => {
            Router.get().setHash('browse');
        });

        ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => {
            this.getBrowseActions().getToggleSearchPanelAction().setVisible(item.isInRangeOrSmaller(ResponsiveRanges._540_720));
        });

        // Required for "enable/disable" actions correctly
        this.getBrowseActions().updateActionsEnabledState([]);

        this.handleGlobalEvents();

        this.debouncedPreviewRefresh = AppHelper.debounce(this.forcePreviewRerender.bind(this), 500);
    }

    protected checkIfItemIsRenderable(browseItem: ContentBrowseItem): Q.Promise<any> {
        const previewHandler: PreviewContentHandler = this.getBrowseActions().getPreviewHandler();
        return previewHandler.checkIfItemIsRenderable(browseItem);
    }

    protected getBrowseActions(): ContentTreeGridActions {
        return <ContentTreeGridActions>super.getBrowseActions();
    }

    getNonToolbarActions(): Action[] {
        return this.getBrowseActions().getPublishActions();
    }

    protected createToolbar(): ContentBrowseToolbar {
        return new ContentBrowseToolbar(this.getBrowseActions());
    }

    protected createTreeGrid(): ContentTreeGrid {
        const treeGrid: ContentTreeGrid = new ContentTreeGrid();

        treeGrid.onDataChanged((event: DataChangedEvent<ContentSummaryAndCompareStatus>) => {
            if (event.getType() === DataChangedType.UPDATED) {
                this.handleTreeGridUpdatedEvent(event);
            }
        });

        return treeGrid;
    }

    private handleTreeGridUpdatedEvent(event: DataChangedEvent<ContentSummaryAndCompareStatus>) {
        this.updateBrowseItems(event.getTreeNodes());
        this.refreshTreeGridActions();
    }

    private updateBrowseItems(nodes: TreeNode<ContentSummaryAndCompareStatus>[]) {
        const browseItems: ContentBrowseItem[] = this.treeNodesToBrowseItems(nodes);
        this.getBrowseItemPanel().updateItems(browseItems);
    }

    private refreshTreeGridActions() {
        this.getBrowseActions().updateActionsEnabledState(this.treeNodesToBrowseItems(this.treeGrid.getSelectedOrHighlightedItems()));
    }

    protected createBrowseItemPanel(): ContentBrowseItemPanel {
        return new ContentBrowseItemPanel();
    }

    protected createFilterPanel(): ContentBrowseFilterPanel {
        const filterPanel: ContentBrowseFilterPanel = new ContentBrowseFilterPanel();

        const showMask = () => {
            if (this.isVisible()) {
                this.treeGrid.mask();
            }
        };

        filterPanel.onSearchStarted(showMask);
        filterPanel.onRefreshStarted(showMask);

        return filterPanel;
    }

    protected createMainContentSplitPanel(gridAndItemsSplitPanel: SplitPanel): SplitPanel {
        const browseActions: ContentTreeGridActions = this.getBrowseActions();
        const mobileActions: Action[] = [
            browseActions.getUnpublishAction(),
            browseActions.getPublishAction(),
            browseActions.getMoveAction(),
            browseActions.getSortAction(),
            browseActions.getDeleteAction(),
            browseActions.getDuplicateAction(),
            browseActions.getEditAction(),
            browseActions.getShowNewDialogAction()
        ];
        this.contextSplitPanel = new ContextSplitPanel(gridAndItemsSplitPanel, mobileActions);

        return this.contextSplitPanel;
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

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.getFilterAndGridSplitPanel());

            this.subscribeMobilePanelOnEvents();
            this.subscribeContextPanelsOnEvents();
            this.createContentPublishMenuButton();
            this.markContentAsReadyOnPublishActions();

            return rendered;
        }).catch((error) => {
            console.error(`Couldn't render ContentBrowsePanel`, error);
            return true;
        });
    }

    private updateContextPanelOnItemChange(selection?: TreeNode<ContentSummaryAndCompareStatus>[]) {
        if (!this.contextSplitPanel.isMobileMode()) {
            // no need to update on selection change in mobile mode as it opens in a separate screen
            const item: BrowseItem<ContentSummaryAndCompareStatus> = this.getFirstSelectedOrHighlightedBrowseItem(selection);
            this.doUpdateContextPanel(item ? item.getModel() : null);
        }
    }

    private subscribeContextPanelsOnEvents() {

        this.getTreeGrid().onSelectionChanged((currentSelection: TreeNode<ContentSummaryAndCompareStatus>[],
                                               fullSelection: TreeNode<ContentSummaryAndCompareStatus>[]) => {
            this.updateContextPanelOnItemChange(fullSelection);
        });

        const onHighlightingChanged = AppHelper.debounce(() => {
            this.updateContextPanelOnItemChange();
        }, 500);

        this.getTreeGrid().onHighlightingChanged(() => onHighlightingChanged());
    }

    private subscribeMobilePanelOnEvents() {

        // selection opens detail panel in mobile mode, so deselect it when returning back to grid
        this.contextSplitPanel.onMobilePanelSlide((out: boolean) => {
            if (out) {
                this.treeGrid.deselectAll();
                this.getBrowseActions().updateActionsEnabledState([]);
            }
        });

        TreeGridItemClickedEvent.on((event: TreeGridItemClickedEvent) => {
            if (this.contextSplitPanel.isMobileMode()) {
                this.contextSplitPanel.setContent(event.getTreeNode().getData());
                this.contextSplitPanel.showMobilePanel();
            }
        });
    }

    // tslint:disable-next-line:max-line-length
    private getFirstSelectedOrHighlightedBrowseItem(fullSelection?: TreeNode<ContentSummaryAndCompareStatus>[]): BrowseItem<ContentSummaryAndCompareStatus> {
        const highlightedNode: TreeNode<ContentSummaryAndCompareStatus> = this.treeGrid.getFirstSelectedOrHighlightedNode();
        if (!fullSelection && !highlightedNode) {
            return null;
        }

        let nodes: TreeNode<ContentSummaryAndCompareStatus>[] = [];

        if (fullSelection && fullSelection.length > 0) {
            nodes = fullSelection;
        } else if (highlightedNode) {
            nodes = [highlightedNode];
        }

        return this.treeNodeToBrowseItem(nodes[0]);
    }

    treeNodeToBrowseItem(node: TreeNode<ContentSummaryAndCompareStatus>): ContentBrowseItem | null {
        const data: ContentSummaryAndCompareStatus = node ? node.getData() : null;
        return (!data || !data.getContentSummary()) ? null : <ContentBrowseItem>new ContentBrowseItem(data)
            .setId(data.getId())
            .setDisplayName(data.getContentSummary().getDisplayName())
            .setPath(data.getContentSummary().getPath().toString())
            .setIconUrl(new ContentIconUrlResolver().setContent(data.getContentSummary()).resolve());
    }

    treeNodesToBrowseItems(nodes: TreeNode<ContentSummaryAndCompareStatus>[]): ContentBrowseItem[] {
        const browseItems: ContentBrowseItem[] = [];

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
                const item: ContentBrowseItem = this.treeNodeToBrowseItem(node);
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
            this.selectInlinedContentInGrid(event.getPreviewPath());
        });

        RepositoryEvent.on(event => {
            if (event.isRestored()) {
                this.treeGrid.reload().then(() => {
                    const fullSelection = this.treeGrid.getRoot().getFullSelection();
                    this.updateContextPanelOnItemChange(fullSelection);
                });
            }
        });
    }

    private selectInlinedContentInGrid(contentInlinePath: string) {
        const path: string = this.getPathFromInlinePath(contentInlinePath);
        if (path) {
            this.treeGrid.selectInlinedContentInGrid(ContentPath.fromString(path));
        }
    }

    private getPathFromInlinePath(contentPreviewPath: string): string {
        return UriHelper.getPathFromPortalInlineUri(contentPreviewPath, RenderingMode.INLINE, RepositoryId.CONTENT_REPO_ID,
            Branch.DRAFT);
    }

    private subscribeOnContentEvents() {
        let handler = ContentServerEventsHandler.getInstance();

        handler.onContentCreated((data: ContentSummaryAndCompareStatus[]) => this.handleContentCreated(data));

        handler.onContentUpdated((data: ContentSummaryAndCompareStatus[]) => this.handleContentUpdated(data));

        handler.onContentPermissionsUpdated((contentIds: ContentIds) => this.handleContentPermissionsUpdated(contentIds));

        handler.onContentRenamed((data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => {
            this.handleContentRenamed(data, oldPaths);
        });

        handler.onContentDeleted((data: ContentServerChangeItem[]) => {
            this.handleContentDeleted(data.map(d => d.getPath()));
        });

        handler.onContentPending((data: ContentSummaryAndCompareStatus[]) => this.handleContentPending(data));

        handler.onContentPublished((data: ContentSummaryAndCompareStatus[]) => this.handleContentPublished(data));

        handler.onContentUnpublished((data: ContentSummaryAndCompareStatus[]) => this.handleContentUnpublished(data));

        handler.onContentDuplicated((data: ContentSummaryAndCompareStatus[]) => this.handleContentCreated(data));

        handler.onContentMoved((data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => {
            // combination of delete and create
            this.handleContentDeleted(oldPaths);
            this.handleContentCreated(data);
        });

        handler.onContentSorted((data: ContentSummaryAndCompareStatus[]) => this.handleContentSorted(data));
    }

    private handleContentCreated(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: created', data);
        }

        this.treeGrid.addContentNodes(data).then(this.refreshFilterWithDelay.bind(this));
    }

    private handleContentRenamed(data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: renamed', data, oldPaths);
        }

        this.treeGrid.renameContentNodes(data, oldPaths).then(this.refreshFilterWithDelay.bind(this));
    }

    private triggerDataChangedEvent(nodes: TreeNode<ContentSummaryAndCompareStatus>[],
                                    eventType: DataChangedType = DataChangedType.UPDATED) {
        const changedEvent = new DataChangedEvent<ContentSummaryAndCompareStatus>(nodes, eventType);
        this.treeGrid.notifyDataChanged(changedEvent);
    }

    private handleContentUpdated(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: updated', data);
        }

        this.doHandleContentUpdate(data).then((updatedNodes) => {

            // Update since CompareStatus changed
            ContentSummaryAndCompareStatusFetcher.updateReadOnly(updatedNodes.map(node => node.getData())).then(() => {
                this.triggerDataChangedEvent(updatedNodes);
                this.updatePreviewIfNeeded(data);
            });
        });
    }

    private handleContentPermissionsUpdated(contentIds: ContentIds) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: permissions updated', contentIds);
        }

        const contentsToUpdateIds: ContentId[] = this.treeGrid.getAllNodes()
            .map((treeNode: TreeNode<ContentSummaryAndCompareStatus>) => treeNode.getData().getContentId())
            .filter((contentId: ContentId) => contentIds.contains(contentId));

        if (contentsToUpdateIds.length === 0) {
            return;
        }

        ContentSummaryAndCompareStatusFetcher.fetchByIds(contentsToUpdateIds)
            .then(this.handleContentUpdated.bind(this))
            .catch(DefaultErrorHandler.handle);
    }

    private handleContentDeleted(paths: ContentPath[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: deleted', paths);
        }

        const deletedNodes: TreeNode<ContentSummaryAndCompareStatus>[] = this.treeGrid.deleteContentNodes(paths);
        this.updateContentPanelOnNodesDelete(deletedNodes);
        this.refreshFilterWithDelay();
    }

    private updateContentPanelOnNodesDelete(deletedNodes: TreeNode<ContentSummaryAndCompareStatus>[]) {
        deletedNodes.forEach((node: TreeNode<ContentSummaryAndCompareStatus>) => {
            const contentSummary: ContentSummary = node.getData().getContentSummary();
            if (node.getData() && !!contentSummary) {
                this.doUpdateContextPanel(null);
            }
        });
    }

    private handleContentPending(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: pending', data);
        }
        this.doHandleContentUpdate(data).then((updatedNodes) => this.triggerDataChangedEvent(updatedNodes));
    }

    private handleContentPublished(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: published', data);
        }
        this.doHandleContentUpdate(data).then((updatedNodes) => this.triggerDataChangedEvent(updatedNodes));
    }

    private handleContentUnpublished(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: unpublished', data);
        }
        this.doHandleContentUpdate(data).then((updatedNodes) => this.triggerDataChangedEvent(updatedNodes));
    }

    private refreshFilterWithDelay() {
        this.setRefreshOfFilterRequired();
        window.setTimeout(() => {
            this.refreshFilter();
        }, 1000);
    }

    private doHandleContentUpdate(data: ContentSummaryAndCompareStatus[]): Q.Promise<TreeNode<ContentSummaryAndCompareStatus>[]> {
        this.updateContextPanel(data);
        return this.treeGrid.updateContentNodes(data);
    }

    private handleContentSorted(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: sorted', data);
        }

        this.treeGrid.sortNodesChildren(data);
    }

    private handleNewMediaUpload(event: NewMediaUploadEvent) {
        event.getUploadItems().forEach((item: UploadItem<ContentSummary>) => {
            this.treeGrid.appendUploadNode(item);
        });
    }

    private updatePreviewIfNeeded(updatedContents: ContentSummaryAndCompareStatus[]) {
        const previewItem: ViewItem<ContentSummaryAndCompareStatus> = this.getBrowseItemPanel().getStatisticsItem();

        if (!previewItem) {
            return;
        }

        const previewItemPath: ContentPath = previewItem.getModel().getPath();
        const isStatisticsItemUpdated: boolean = this.updateStatisticsItemIfNeeded(updatedContents, previewItemPath);

        if (isStatisticsItemUpdated) {
            this.debouncedPreviewRefresh();
            return;
        }

        if (updatedContents.some((content: ContentSummaryAndCompareStatus) => content.getContentSummary().isPageTemplate())) {
            this.debouncedPreviewRefresh();
            return;
        }

        this.isAnyContentIdWithinPreviewItem(previewItem, updatedContents).then((value: boolean) => {
            if (value) {
                this.debouncedPreviewRefresh();
            } else {
                this.isAnyContentReferencedByPreviewItem(previewItem, updatedContents).then((isReferenced: boolean) => {
                    if (isReferenced) {
                        this.debouncedPreviewRefresh();
                    }
                });
            }
        });
    }

    private updateStatisticsItemIfNeeded(contents: ContentSummaryAndCompareStatus[], previewItemPath: ContentPath): boolean {
        return contents.some((content: ContentSummaryAndCompareStatus) => {
            if (content.getPath().equals(previewItemPath)) {
                this.updateStatisticsItem(content);

                return true;
            }
        });
    }

    private isAnyContentIdWithinPreviewItem(previewItem: ViewItem<ContentSummaryAndCompareStatus>,
                                            updatedContents: ContentSummaryAndCompareStatus[]): Q.Promise<boolean> {
        return new GetContentByIdRequest(previewItem.getModel().getContentId()).sendAndParse().then((previewItemContent: Content) => {
            const promises: Q.Promise<void>[] = [];
            let result: boolean = false;

            updatedContents.forEach((content: ContentSummaryAndCompareStatus) => {
                promises.push(
                    ContentHelper.containsChildContentId(previewItemContent, content.getContentId()).then((containsId: boolean) => {
                        if (containsId) {
                            result = true;
                        }
                    }));
            });

            return Q.all(promises).then(() => {
                return result;
            });

        });
    }

    private isAnyContentReferencedByPreviewItem(previewItem: ViewItem<ContentSummaryAndCompareStatus>,
                                                updatedContents: ContentSummaryAndCompareStatus[]): Q.Promise<boolean> {
        return Q.all(updatedContents.map(updatedContent =>
            ContentHelper.isReferencedBy(updatedContent.getContentSummary(), previewItem.getModel().getContentId()))
        ).then((results: boolean[]) => results.some(result => result));
    }

    private updateStatisticsItem(content: ContentSummaryAndCompareStatus) {
        new IsRenderableRequest(content.getContentId()).sendAndParse().then((renderable: boolean) => {
            this.getBrowseItemPanel().setStatisticsItem(this.toBrowseItem(content, renderable));
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
        const previewItem: ViewItem<ContentSummaryAndCompareStatus> = this.getBrowseItemPanel().getStatisticsItem();

        if (BrowserHelper.isMobile()) {
            this.contextSplitPanel.setMobilePreviewItem(previewItem, true);
        } else {
            (<ContentItemStatisticsPanel>this.getBrowseItemPanel().getItemStatisticsPanel()).getPreviewPanel().setItem(previewItem, true);
        }
    }

    private updateContextPanel(data: ContentSummaryAndCompareStatus[]) {
        const contextPanel: ContextPanel = ActiveContextPanelManager.getActiveContextPanel();
        const itemInDetailPanel: ContentSummaryAndCompareStatus = contextPanel ? contextPanel.getItem() : null;

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
        const contextPanel: ContextPanel = ActiveContextPanelManager.getActiveContextPanel();
        if (contextPanel) {
            contextPanel.setItem(item);
        }
    }

    getBrowseItemPanel(): ContentBrowseItemPanel {
        return <ContentBrowseItemPanel>super.getBrowseItemPanel();
    }

    private createContentPublishMenuButton() {
        const browseActions: ContentTreeGridActions = this.getBrowseActions();
        const contentPublishMenuButton: ContentBrowsePublishMenuButton = new ContentBrowsePublishMenuButton({
            publishAction: browseActions.getPublishAction(),
            publishTreeAction: browseActions.getPublishTreeAction(),
            unpublishAction: browseActions.getUnpublishAction(),
            markAsReadyAction: browseActions.getMarkAsReadyAction(),
            createIssueAction: browseActions.getCreateIssueAction(),
            requestPublishAction: browseActions.getRequestPublishAction(),
            showCreateIssueButtonByDefault: true
        });

        let previousSelectionSize = this.treeGrid.getRoot().getFullSelection().length;
        this.treeGrid.onSelectionChanged((
            currentSelection: TreeNode<ContentSummaryAndCompareStatus>[],
            fullSelection: TreeNode<ContentSummaryAndCompareStatus>[]
        ) => {
            const isSingleSelected = fullSelection.length === 1;
            const hadMultipleSelection = previousSelectionSize > 1;

            previousSelectionSize = fullSelection.length;
            contentPublishMenuButton.setItem(isSingleSelected ? fullSelection[0].getData() : null);
            if (hadMultipleSelection && isSingleSelected) {
                contentPublishMenuButton.updateActiveClass();
            }
        });

        this.treeGrid.onHighlightingChanged(
            (item: TreeNode<ContentSummaryAndCompareStatus>) => contentPublishMenuButton.setItem(item ? item.getData() : null));

        this.browseToolbar.appendChild(contentPublishMenuButton);

        browseActions.onBeforeActionsStashed(() => {
            contentPublishMenuButton.setRefreshDisabled(true);
        });

        browseActions.onActionsUnstashed(() => {
            contentPublishMenuButton.setRefreshDisabled(false);
        });
    }

    private markContentAsReadyOnPublishActions() {
        const handler: () => void = this.markSingleContentAsReady.bind(this);
        this.getBrowseActions().getPublishAction().onBeforeExecute(handler);
        this.getBrowseActions().getPublishTreeAction().onBeforeExecute(handler);
        this.getBrowseActions().getRequestPublishAction().onBeforeExecute(handler);
    }

    private markSingleContentAsReady() {
        const contents: ContentSummaryAndCompareStatus[] = this.treeGrid.getSelectedDataList();

        if (contents.length > 1) { // only when single item selected
            return;
        }

        this.getBrowseActions().getMarkAsReadyAction().execute();
    }
}
