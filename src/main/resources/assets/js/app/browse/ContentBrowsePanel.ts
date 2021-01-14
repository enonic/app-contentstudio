import * as Q from 'q';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from 'lib-admin-ui/ui/responsive/ResponsiveItem';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {ActionName, ContentTreeGridActions} from './action/ContentTreeGridActions';
import {ContentBrowseToolbar} from './ContentBrowseToolbar';
import {ContentTreeGrid, State} from './ContentTreeGrid';
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
import {Content} from '../content/Content';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentBrowsePublishMenuButton} from './ContentBrowsePublishMenuButton';
import {ContextPanel} from '../view/context/ContextPanel';
import {PreviewContentHandler} from './action/handler/PreviewContentHandler';
import {BrowseItem} from 'lib-admin-ui/app/browse/BrowseItem';
import {UploadItem} from 'lib-admin-ui/ui/uploader/UploadItem';
import {ResponsiveRanges} from 'lib-admin-ui/ui/responsive/ResponsiveRanges';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {DataChangedEvent, DataChangedType} from 'lib-admin-ui/ui/treegrid/DataChangedEvent';
import {TreeGridItemClickedEvent} from 'lib-admin-ui/ui/treegrid/TreeGridItemClickedEvent';
import {ContentIconUrlResolver} from 'lib-admin-ui/content/util/ContentIconUrlResolver';
import {RepositoryEvent} from 'lib-admin-ui/content/event/RepositoryEvent';
import {SplitPanel} from 'lib-admin-ui/ui/panel/SplitPanel';
import {Action} from 'lib-admin-ui/ui/Action';
import {ViewItem} from 'lib-admin-ui/app/view/ViewItem';
import {BrowsePanel} from 'lib-admin-ui/app/browse/BrowsePanel';
import {BrowserHelper} from 'lib-admin-ui/BrowserHelper';
import {ContentIds} from '../ContentIds';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {UrlAction} from '../UrlAction';
import {ProjectContext} from '../project/ProjectContext';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {DeletedContentItem} from './DeletedContentItem';

export class ContentBrowsePanel
    extends BrowsePanel<ContentSummaryAndCompareStatus> {

    protected treeGrid: ContentTreeGrid;
    protected browseToolbar: ContentBrowseToolbar;
    protected filterPanel: ContentBrowseFilterPanel;
    private contextSplitPanel: ContextSplitPanel;
    private debouncedPreviewRefresh: () => void;

    constructor() {
        super();
    }

    protected initElements() {
        super.initElements();

        this.debouncedPreviewRefresh = AppHelper.debounce(this.forcePreviewRerender.bind(this), 500);

        if (!ProjectContext.get().isInitialized()) {
            this.handleProjectNotSet();
        } else {
            this.getBrowseActions().updateActionsEnabledState([]);
        }
    }

    private handleProjectNotSet() {
        this.getBrowseActions().setState(State.DISABLED);
        this.toggleFilterPanelAction.setEnabled(false);
        this.contextSplitPanel.disableToggleButton();
        this.treeGrid.setState(State.DISABLED);

        const projectSetHandler = () => {
            this.getBrowseActions().setState(State.ENABLED);
            this.toggleFilterPanelAction.setEnabled(true);
            this.contextSplitPanel.enableToggleButton();
            this.treeGrid.setState(State.ENABLED);
            Router.get().setHash(UrlAction.BROWSE);
            ProjectContext.get().unProjectChanged(projectSetHandler);
        };

        ProjectContext.get().onProjectChanged(projectSetHandler);
    }

    protected initListeners() {
        super.initListeners();

        this.onShown(() => {
            if (ProjectContext.get().isInitialized()) {
                Router.get().setHash(UrlAction.BROWSE);
            }
        });

        this.handleGlobalEvents();
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
        this.updateBrowseItems(event.getTreeNodes().map(node => node.getData()));
        this.refreshTreeGridActions();
    }

    private updateBrowseItems(items: ContentSummaryAndCompareStatus[]) {
        const browseItems: ContentBrowseItem[] = <ContentBrowseItem[]>this.dataItemsToBrowseItems(items);
        this.getBrowseItemPanel().updateItems(browseItems);
    }

    private refreshTreeGridActions() {
        this.getBrowseActions()
            .updateActionsEnabledState(<ContentBrowseItem[]>this.dataItemsToBrowseItems(this.treeGrid.getSelectedOrHighlightedItems()));
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
            browseActions.getAction(ActionName.UNPUBLISH),
            browseActions.getAction(ActionName.PUBLISH),
            browseActions.getAction(ActionName.MOVE),
            browseActions.getAction(ActionName.SORT),
            browseActions.getAction(ActionName.DELETE),
            browseActions.getAction(ActionName.DUPLICATE),
            browseActions.getAction(ActionName.EDIT),
            browseActions.getAction(ActionName.SHOW_NEW_DIALOG)
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

            return rendered;
        }).catch((error) => {
            console.error(`Couldn't render ContentBrowsePanel`, error);
            return true;
        });
    }

    private updateContextPanelOnItemChange() {
        if (this.contextSplitPanel.isMobileMode()) {
            return; // no need to update on selection change in mobile mode as it opens in a separate screen
        }

        if (this.treeGrid.isAnySelected()) {
            this.doUpdateContextPanel(this.treeGrid.getCurrentSelection().pop());

            return;
        }

        if (this.treeGrid.hasHighlightedNode()) {
            this.doUpdateContextPanel(this.treeGrid.getHighlightedItem());

            return;
        }

        this.doUpdateContextPanel(null);
    }

    private subscribeContextPanelsOnEvents() {
        this.treeGrid.onSelectionChanged(() => {
            this.updateContextPanelOnItemChange();
        });

        const onHighlightingChanged = AppHelper.debounce(() => {
            this.updateContextPanelOnItemChange();
        }, 500);

        this.getTreeGrid().onHighlightingChanged(onHighlightingChanged);
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

    dataToBrowseItem(data: ContentSummaryAndCompareStatus): ContentBrowseItem | null {
        return (!data || !data.getContentSummary()) ? null : <ContentBrowseItem>new ContentBrowseItem(data)
            .setId(data.getId())
            .setDisplayName(data.getContentSummary().getDisplayName())
            .setPath(data.getContentSummary().getPath().toString())
            .setIconUrl(new ContentIconUrlResolver().setContent(data.getContentSummary()).resolve());
    }

    private handleGlobalEvents() {
        ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => {
            this.getBrowseActions().getAction(ActionName.TOGGLE_SEARCH_PANEL).setVisible(
                item.isInRangeOrSmaller(ResponsiveRanges._540_720));
        });

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
                    this.updateContextPanelOnItemChange();
                });
            }
        });

        ProjectContext.get().onProjectChanged(() => {
            this.treeGrid.deselectAll();
            this.filterPanel.reset().then(() => {
                this.hideFilterPanel();
                this.toggleFilterPanelButton.removeClass('filtered');
                this.treeGrid.reload();
            });
        });
    }

    private selectInlinedContentInGrid(contentInlinePath: string) {
        const path: string = this.getPathFromInlinePath(contentInlinePath);
        if (path) {
            this.treeGrid.selectInlinedContentInGrid(ContentPath.fromString(path));
        }
    }

    private getPathFromInlinePath(contentPreviewPath: string): string {
        return UriHelper.getPathFromPortalInlineUri(contentPreviewPath, RenderingMode.INLINE);
    }

    private subscribeOnContentEvents() {
        const handler: ContentServerEventsHandler = ContentServerEventsHandler.getInstance();

        handler.onContentCreated((data: ContentSummaryAndCompareStatus[]) => this.handleContentCreated(data));

        handler.onContentUpdated((data: ContentSummaryAndCompareStatus[]) => this.handleContentUpdated(data));

        handler.onContentPermissionsUpdated((contentIds: ContentIds) => this.handleContentPermissionsUpdated(contentIds));

        handler.onContentRenamed((data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => {
            this.handleContentRenamed(data, oldPaths);
        });

        handler.onContentDeleted((data: ContentServerChangeItem[]) => {
            this.handleContentDeleted(
                data.map((item: ContentServerChangeItem) => new DeletedContentItem(item.getContentId(), item.getContentPath())));
        });

        handler.onContentPending((data: ContentSummaryAndCompareStatus[]) => this.handleContentPending(data));

        handler.onContentPublished((data: ContentSummaryAndCompareStatus[]) => this.handleContentPublished(data));

        handler.onContentUnpublished((data: ContentSummaryAndCompareStatus[]) => this.handleContentUnpublished(data));

        handler.onContentDuplicated((data: ContentSummaryAndCompareStatus[]) => this.handleContentCreated(data));

        handler.onContentMoved((data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => {
            // combination of delete and create
            this.handleContentDeleted(data.map(
                (item: ContentSummaryAndCompareStatus, index: number) => new DeletedContentItem(item.getContentId(), oldPaths[index])));
            this.handleContentCreated(data);
        });

        handler.onContentSorted((data: ContentSummaryAndCompareStatus[]) => this.handleContentSorted(data));
    }

    private handleContentCreated(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: created', data);
        }

        this.treeGrid.addContentNodes(data);
        this.refreshFilterWithDelay.bind(this);
    }

    private handleContentRenamed(data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: renamed', data, oldPaths);
        }

        this.treeGrid.renameContentNodes(data);
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
        this.updatePreviewIfNeeded(data);
    }

    private handleContentPermissionsUpdated(contentIds: ContentIds) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: permissions updated', contentIds);
        }

        const contentsToUpdateIds: ContentId[] = [];
        contentIds.map((contentId: ContentId) => {
            if (this.treeGrid.hasItemWithDataId(contentId.toString())) {
                contentsToUpdateIds.push(contentId);
            }
        });

        if (contentsToUpdateIds.length === 0) {
            return;
        }

        ContentSummaryAndCompareStatusFetcher.fetchByIds(contentsToUpdateIds)
            .then(this.handleContentUpdated.bind(this))
            .catch(DefaultErrorHandler.handle);
    }

    private handleContentDeleted(items: DeletedContentItem[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: deleted', items.map(i => i.id.toString()));
        }

        this.treeGrid.deleteItems(items);
        this.updateContextPanelOnNodesDelete(items);
        this.refreshFilterWithDelay();
    }

    private updateContextPanelOnNodesDelete(items: DeletedContentItem[]) {
        const contextPanel: ContextPanel = ActiveContextPanelManager.getActiveContextPanel();
        const itemInDetailPanel: ContentSummaryAndCompareStatus = contextPanel ? contextPanel.getItem() : null;

        if (!itemInDetailPanel) {
            return;
        }

        const itemId: ContentId = itemInDetailPanel.getContentId();

        if (items.some((item: DeletedContentItem) => item.id.equals(itemId))) {
            this.doUpdateContextPanel(null);
        }
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

        if (this.treeGrid.hasSelectedOrHighlightedNode() &&
            data.some((publishedItem: ContentSummaryAndCompareStatus) => !this.treeGrid.hasItemWithDataId(publishedItem.getId()))) {
            this.refreshTreeGridActions();
        }
    }

    private handleContentUnpublished(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: unpublished', data);
        }
        this.doHandleContentUpdate(data);
    }

    private refreshFilterWithDelay() {
        this.setRefreshOfFilterRequired();
        window.setTimeout(() => {
            this.refreshFilter();
        }, 1000);
    }

    private doHandleContentUpdate(data: ContentSummaryAndCompareStatus[]) {
        this.updateContextPanel(data);
        this.treeGrid.updateNodesByData(data);
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
            publishAction: browseActions.getAction(ActionName.PUBLISH),
            publishTreeAction: browseActions.getAction(ActionName.PUBLISH_TREE),
            unpublishAction: browseActions.getAction(ActionName.UNPUBLISH),
            markAsReadyAction: browseActions.getAction(ActionName.MARK_AS_READY),
            createIssueAction: browseActions.getAction(ActionName.CREATE_ISSUE),
            requestPublishAction: browseActions.getAction(ActionName.REQUEST_PUBLISH),
            showCreateIssueButtonByDefault: true
        });

        let previousSelectionSize: number = this.treeGrid.getTotalSelected();

        this.treeGrid.onSelectionChanged(() => {
            const totalSelected: number = this.treeGrid.getTotalSelected();
            const isSingleSelected: boolean = totalSelected === 1;
            const hadMultipleSelection: boolean = previousSelectionSize > 1;

            previousSelectionSize = totalSelected;
            contentPublishMenuButton.setItem(isSingleSelected ? this.treeGrid.getFirstSelectedItem() : null);
            if (hadMultipleSelection && isSingleSelected) {
                contentPublishMenuButton.updateActiveClass();
            }
        });

        this.treeGrid.onHighlightingChanged(() => {
            contentPublishMenuButton.setItem(this.treeGrid.hasHighlightedNode() ? this.treeGrid.getHighlightedItem() : null);
        });

        this.browseToolbar.appendChild(contentPublishMenuButton);

        browseActions.onBeforeActionsStashed(() => {
            contentPublishMenuButton.setRefreshDisabled(true);
        });

        browseActions.onActionsUnStashed(() => {
            contentPublishMenuButton.setRefreshDisabled(false);
        });
    }

}
