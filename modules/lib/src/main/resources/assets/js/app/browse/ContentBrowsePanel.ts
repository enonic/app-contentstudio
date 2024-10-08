import * as Q from 'q';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {ActionName, ContentTreeGridActions} from './action/ContentTreeGridActions';
import {ContentBrowseToolbar} from './ContentBrowseToolbar';
import {ContentTreeGrid, State} from './ContentTreeGrid';
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
            this.treeGrid.resizeCanvas();
        });

        this.filterPanel.onSearchEvent((query?: ContentQuery) => {
            this.treeGrid.setTargetBranch(this.filterPanel.getTargetBranch());
            this.treeGrid.setFilterQuery(query);
        });

        this.handleGlobalEvents();

        this.treeGrid.onSelectionOrHighlightingChanged(() => {
            const previewPanel: ContentItemPreviewPanel = this.getPreviewPanel();
            const selectedItem: ContentSummaryAndCompareStatus = this.treeGrid.getLastSelectedOrHighlightedItem();
            if (!!selectedItem && previewPanel.isPreviewUpdateNeeded(selectedItem)) {
                previewPanel.showMask();
            }
        }, false);

        this.treeGrid.onDoubleClick(() => {
            const previewPanel: ContentItemPreviewPanel = this.getPreviewPanel();

            if (previewPanel.isMaskOn()) {
                previewPanel.hideMask(); // dbl click, item is not selected, no need to show a load mask
            }
        });
    }

    protected getBrowseActions(): ContentTreeGridActions {
        return super.getBrowseActions() as ContentTreeGridActions;
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
                this.treeGrid.mask();
            }
        };

        filterPanel.onSearchStarted(showMask);

        return filterPanel;
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
            if (this.treeGrid.getToolbar().getSelectionPanelToggler().isActive()) {
                this.treeGrid.getToolbar().getSelectionPanelToggler().setActive(false);
            }

            this.showFilterPanel();
            this.filterPanel.setTargetBranch(event.getBranch());
            this.filterPanel.setDependencyItem(event.getContent(), event.isInbound(), event.getType());
        });

        SearchAndExpandItemEvent.on((event: SearchAndExpandItemEvent) => {
           const contentId: ContentId = event.getContentId();

            if (this.treeGrid.getToolbar().getSelectionPanelToggler().isActive()) {
                this.treeGrid.getToolbar().getSelectionPanelToggler().setActive(false);
            }

            this.showFilterPanel();
            const expandLoadedItemHandler = () => {
                if (this.treeGrid.isFiltered()) {
                    this.treeGrid.unLoaded(expandLoadedItemHandler);
                    this.treeGrid.expandNodeByDataId(contentId.toString());
                }
            };
            this.treeGrid.onLoaded(expandLoadedItemHandler);
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
                this.treeGrid.reload().then(() => {
                    this.updatePreviewItem();
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
        });
    }

    private selectInlinedContentInGrid(contentInlinePath: string) {
        const path: string = this.getPathFromInlinePath(contentInlinePath);

        if (path) {
            this.treeGrid.selectInlinedContentInGrid(ContentPath.create().fromString(path).build());
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
            this.treeGrid.addContentNodes(data);
            this.refreshFilterWithDelay();
        }
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
    }

    private handleContentPermissionsUpdated(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: permissions updated', data);
        }

        if (!data || data.length === 0 ||
            !data.some((summary: ContentSummaryAndCompareStatus) => this.treeGrid.hasItemWithDataId(summary.getId()))) {
            return;
        }

        this.treeGrid.copyStatusFromExistingNodes(data);
        this.treeGrid.updateNodes(data);
    }

    private handleContentDeleted(items: DeletedContentItem[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: deleted', items.map(i => i.id.toString()));
        }

        this.handleCUD();
        this.treeGrid.deleteItems(items);

        if (this.treeGrid.isFiltered() && this.treeGrid.isEmpty()) {
            this.treeGrid.resetFilter();
        }

        this.updateContextPanelOnNodesDelete(items);
        this.refreshFilterWithDelay();
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
        this.treeGrid.copyPermissionsFromExistingNodes(data);
        this.treeGrid.updateNodes(data);
        this.refreshFilterWithDelay();
    }

    private handleContentSorted(data: ContentSummaryAndCompareStatus[]) {
        if (ContentBrowsePanel.debug) {
            console.debug('ContentBrowsePanel: sorted', data);
        }

        this.treeGrid.sortNodesChildren(data);
        this.updateContextPanel(data);
    }

    private handleNewMediaUpload(event: NewMediaUploadEvent) {
        event.getUploadItems().forEach((item: UploadItem<ContentSummary>) => {
            this.treeGrid.appendUploadNode(item);
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
        const browseActions: ContentTreeGridActions = this.getBrowseActions();
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

        this.treeGrid.onSelectionChanged(() => {
            const totalSelected: number = this.treeGrid.getTotalSelected();

            if (totalSelected === 0) {
                contentActionMenuButton.setItem(null);
            } else if (totalSelected === 1) {
                contentActionMenuButton.setItem(this.treeGrid.getFirstSelectedItem());
            }
        });

        this.treeGrid.onHighlightingChanged(() => {
            contentActionMenuButton.setItem(this.treeGrid.hasHighlightedNode() ? this.treeGrid.getHighlightedItem() : null);
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

        if (this.treeGrid.hasSelectedOrHighlightedNode()) {
            this.browseActionsAndPreviewUpdateRequired = true;
            this.debouncedBrowseActionsAndPreviewRefreshOnDemand();
        }
    }

    protected updateActionsAndPreview(): void {
        this.browseActionsAndPreviewUpdateRequired = false;

        const selectedItem: ContentSummaryAndCompareStatus = this.treeGrid.getLastSelectedOrHighlightedItem();

        if (selectedItem) {
            new IsRenderableRequest(selectedItem.getContentSummary()).sendAndParse().then((statusCode: number) => {
                this.treeGrid.updateItemIsRenderable(selectedItem.getId(), statusCode === StatusCode.OK);
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
}
