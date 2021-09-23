import * as Q from 'q';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from 'lib-admin-ui/ui/responsive/ResponsiveItem';
import {ActionName, ContentTreeGridActions} from './action/ContentTreeGridActions';
import {ContentBrowseToolbar} from './ContentBrowseToolbar';
import {ContentTreeGrid, State} from './ContentTreeGrid';
import {ContentBrowseFilterPanel} from './filter/ContentBrowseFilterPanel';
import {ContentBrowseItemPanel} from './ContentBrowseItemPanel';
import {Router} from '../Router';
import {ActiveContextPanelManager} from '../view/context/ActiveContextPanelManager';
import {ToggleSearchPanelEvent} from './ToggleSearchPanelEvent';
import {ToggleSearchPanelWithDependenciesEvent} from './ToggleSearchPanelWithDependenciesEvent';
import {NewMediaUploadEvent} from '../create/NewMediaUploadEvent';
import {ContentPreviewPathChangedEvent} from '../view/ContentPreviewPathChangedEvent';
import {ContextSplitPanel} from '../view/context/ContextSplitPanel';
import {RenderingMode} from '../rendering/RenderingMode';
import {UriHelper} from '../rendering/UriHelper';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentBrowsePublishMenuButton} from './ContentBrowsePublishMenuButton';
import {ContextPanel} from '../view/context/ContextPanel';
import {UploadItem} from 'lib-admin-ui/ui/uploader/UploadItem';
import {ResponsiveRanges} from 'lib-admin-ui/ui/responsive/ResponsiveRanges';
import {TreeGridItemClickedEvent} from 'lib-admin-ui/ui/treegrid/TreeGridItemClickedEvent';
import {RepositoryEvent} from 'lib-admin-ui/content/event/RepositoryEvent';
import {SplitPanel} from 'lib-admin-ui/ui/panel/SplitPanel';
import {Action} from 'lib-admin-ui/ui/Action';
import {BrowsePanel} from 'lib-admin-ui/app/browse/BrowsePanel';
import {ContentIds} from '../content/ContentIds';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {UrlAction} from '../UrlAction';
import {ProjectContext} from '../project/ProjectContext';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {DeletedContentItem} from './DeletedContentItem';
import {IsRenderableRequest} from '../resource/IsRenderableRequest';
import {ContentSummary} from '../content/ContentSummary';
import {ContentId} from '../content/ContentId';
import {ContentPath} from '../content/ContentPath';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {i18n} from 'lib-admin-ui/util/Messages';
import {NonMobileContextPanelToggleButton} from '../view/context/button/NonMobileContextPanelToggleButton';

export class ContentBrowsePanel
    extends BrowsePanel {

    protected treeGrid: ContentTreeGrid;
    protected browseToolbar: ContentBrowseToolbar;
    protected filterPanel: ContentBrowseFilterPanel;
    private contextSplitPanel: ContextSplitPanel;
    private debouncedFilterRefresh: () => void;
    private debouncedBrowseActionsAndPreviewRefreshOnDemand: () => void;
    private browseActionsAndPreviewUpdateRequired: boolean = false;
    private contextPanelToggler: NonMobileContextPanelToggleButton;
    private contentFetcher: ContentSummaryAndCompareStatusFetcher;

    constructor() {
        super();
    }

    protected initElements() {
        super.initElements();

        this.contentFetcher = new ContentSummaryAndCompareStatusFetcher();
        this.debouncedFilterRefresh = AppHelper.debounce(this.refreshFilter.bind(this), 1000);
        this.debouncedBrowseActionsAndPreviewRefreshOnDemand = AppHelper.debounce(() => {
            if (this.browseActionsAndPreviewUpdateRequired) {
                this.updateActionsAndPreview();
            }
        }, 300);

        this.contextPanelToggler = new NonMobileContextPanelToggleButton();

        if (!ProjectContext.get().isInitialized()) {
            this.handleProjectNotSet();
        } else {
            this.getBrowseActions().updateActionsEnabledState([]);
        }
    }

    private handleProjectNotSet() {
        this.getBrowseActions().setState(State.DISABLED);
        this.toggleFilterPanelAction.setEnabled(false);
        this.contextPanelToggler.setEnabled(false);
        this.treeGrid.setState(State.DISABLED);

        const projectSetHandler = () => {
            this.getBrowseActions().setState(State.ENABLED);
            this.toggleFilterPanelAction.setEnabled(true);
            this.contextPanelToggler.setEnabled(true);
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
        return new ContentTreeGrid();
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

    protected createBrowseWithItemsPanel(): SplitPanel {
        const browseActions: ContentTreeGridActions = this.getBrowseActions();
        const mobileActions: Action[] = [
            browseActions.getAction(ActionName.UNPUBLISH),
            browseActions.getAction(ActionName.PUBLISH),
            browseActions.getAction(ActionName.MOVE),
            browseActions.getAction(ActionName.SORT),
            browseActions.getAction(ActionName.ARCHIVE),
            browseActions.getAction(ActionName.DUPLICATE),
            browseActions.getAction(ActionName.EDIT),
            browseActions.getAction(ActionName.SHOW_NEW_DIALOG)
        ];

        this.contextSplitPanel = new ContextSplitPanel(this.getBrowseItemPanel(), mobileActions);

        return this.contextSplitPanel;
    }

    protected updateFilterPanelOnSelectionChange() {
        this.filterPanel.setSelectedItems(this.treeGrid.getSelectedItems());
    }

    protected enableSelectionMode() {
        this.filterPanel.setSelectedItems(this.treeGrid.getSelectedItems());
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

            this.addClass('content-browse-panel');

            return rendered;
        }).catch((error) => {
            console.error('Couldn\'t render ContentBrowsePanel', error);
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

        ProjectContext.get().onNoProjectsAvailable(() => {
            this.handleProjectNotSet();
            this.treeGrid.clean();
            NotifyManager.get().showWarning(i18n('notify.settings.project.notInitialized'));
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
            const items: DeletedContentItem[] = oldPaths.map(
                (oldPath: ContentPath, index: number) => new DeletedContentItem(data[index]?.getContentId(), oldPath));

            this.handleContentDeleted(items);
            this.handleContentCreated(data);
        });

        handler.onContentSorted((data: ContentSummaryAndCompareStatus[]) => this.handleContentSorted(data));
    }

    private handleContentCreated(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: created', data);
        }

        if (data && data.length > 0) {
            this.handleCUD();
            this.treeGrid.addContentNodes(data);
            this.refreshFilterWithDelay();
        }
    }

    private handleContentRenamed(data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: renamed', data, oldPaths);
        }

        this.handleCUD();
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

        this.contentFetcher.fetchByIds(contentsToUpdateIds)
            .then(this.handleContentUpdated.bind(this))
            .catch(DefaultErrorHandler.handle);
    }

    private handleContentDeleted(items: DeletedContentItem[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: deleted', items.map(i => i.id.toString()));
        }

        this.handleCUD();
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

        const itemPath: ContentPath = itemInDetailPanel.getContentSummary().getPath();

        if (items.some((item: DeletedContentItem) => item.path.equals(itemPath))) {
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
        this.browseToolbar.appendChild(this.contextPanelToggler);

        browseActions.onBeforeActionsStashed(() => {
            contentPublishMenuButton.setRefreshDisabled(true);
        });

        browseActions.onActionsUnStashed(() => {
            contentPublishMenuButton.setRefreshDisabled(false);
        });
    }

    private handleCUD() {
        IsRenderableRequest.clearCache();

        if (this.treeGrid.hasSelectedOrHighlightedNode()) {
            this.browseActionsAndPreviewUpdateRequired = true;
            this.debouncedBrowseActionsAndPreviewRefreshOnDemand();
        }
    }

    protected updateActionsAndPreview(): void {
        this.browseActionsAndPreviewUpdateRequired = false;

        this.contentFetcher.updateRenderableContents(this.treeGrid.getSelectedDataList()).then(() => {
            super.updateActionsAndPreview();
        }).catch(DefaultErrorHandler.handle);
    }

}
