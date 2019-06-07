import {SortContentEvent} from './SortContentEvent';
import {ContentTreeGridActions} from './action/ContentTreeGridActions';
import {TreeNodesOfContentPath} from './TreeNodesOfContentPath';
import {TreeNodeParentOfContent} from './TreeNodeParentOfContent';
import {ContentTreeGridToolbar} from './ContentTreeGridToolbar';
import {ActiveContentVersionSetEvent} from '../event/ActiveContentVersionSetEvent';
import {ContentTreeGridLoadedEvent} from './ContentTreeGridLoadedEvent';
import {ContentQueryRequest} from '../resource/ContentQueryRequest';
import {ContentQueryResult} from '../resource/ContentQueryResult';
import {CompareContentResults} from '../resource/CompareContentResults';
import {CompareContentRequest} from '../resource/CompareContentRequest';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {ContentResponse} from '../resource/ContentResponse';
import {ContentRowFormatter} from './ContentRowFormatter';
import {EditContentEvent} from '../event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {CompareStatus} from '../content/CompareStatus';
import {ContentQuery} from '../content/ContentQuery';
import ElementHelper = api.dom.ElementHelper;
import TreeGrid = api.ui.treegrid.TreeGrid;
import TreeNode = api.ui.treegrid.TreeNode;
import TreeGridBuilder = api.ui.treegrid.TreeGridBuilder;
import DateTimeFormatter = api.ui.treegrid.DateTimeFormatter;
import TreeGridContextMenu = api.ui.treegrid.TreeGridContextMenu;
import ContentSummary = api.content.ContentSummary;
import ContentPath = api.content.ContentPath;
import ContentSummaryBuilder = api.content.ContentSummaryBuilder;
import ContentSummaryJson = api.content.json.ContentSummaryJson;
import ResponsiveRanges = api.ui.responsive.ResponsiveRanges;
import ContentId = api.content.ContentId;
import BrowseFilterResetEvent = api.app.browse.filter.BrowseFilterResetEvent;
import BrowseFilterRefreshEvent = api.app.browse.filter.BrowseFilterRefreshEvent;
import BrowseFilterSearchEvent = api.app.browse.filter.BrowseFilterSearchEvent;
import i18n = api.util.i18n;

export class ContentTreeGrid
    extends TreeGrid<ContentSummaryAndCompareStatus> {

    static MAX_FETCH_SIZE: number = 10;

    private filterQuery: ContentQuery;

    constructor() {
        let builder: TreeGridBuilder<ContentSummaryAndCompareStatus> =
            new TreeGridBuilder<ContentSummaryAndCompareStatus>().setColumnConfig([{
                name: 'Name',
                id: 'displayName',
                field: 'contentSummary.displayName',
                formatter: ContentRowFormatter.nameFormatter,
                style: {minWidth: 130}
            }, {
                name: 'CompareStatus',
                id: 'compareStatus',
                field: 'compareStatus',
                formatter: ContentRowFormatter.statusFormatter,
                style: {cssClass: 'status', minWidth: 75, maxWidth: 75}
            }, {
                name: 'Order',
                id: 'order',
                field: 'contentSummary.order',
                formatter: ContentRowFormatter.orderFormatter,
                style: {cssClass: 'order', minWidth: 25, maxWidth: 40}
            }, {
                name: 'ModifiedTime',
                id: 'modifiedTime',
                field: 'contentSummary.modifiedTime',
                formatter: DateTimeFormatter.format,
                style: {cssClass: 'modified', minWidth: 135, maxWidth: 135}
            }]).setPartialLoadEnabled(true).setLoadBufferSize(20).// rows count
            prependClasses('content-tree-grid');

        const [
            nameColumn,
            compareStatusColumn,
            orderColumn,
            modifiedTimeColumn,
        ] = builder.getColumns().slice(0);

        const updateColumns = () => {
            const width = this.getEl().getWidth();
            const checkSelIsMoved = ResponsiveRanges._540_720.isFitOrSmaller(api.dom.Body.get().getEl().getWidth());

            const curClass = nameColumn.getCssClass();

            if (checkSelIsMoved) {
                nameColumn.setCssClass(curClass || 'shifted');
            } else if (curClass && curClass.indexOf('shifted') >= 0) {
                nameColumn.setCssClass(curClass.replace('shifted', ''));
            }

            if (ResponsiveRanges._240_360.isFitOrSmaller(width)) {
                this.setColumns([nameColumn, orderColumn], checkSelIsMoved);
            } else if (ResponsiveRanges._540_720.isFitOrSmaller(width)) {
                modifiedTimeColumn.setMaxWidth(90);
                modifiedTimeColumn.setFormatter(DateTimeFormatter.formatNoTimestamp);
                this.setColumns([nameColumn, orderColumn, compareStatusColumn], checkSelIsMoved);
            } else {
                modifiedTimeColumn.setMaxWidth(135);
                modifiedTimeColumn.setFormatter(DateTimeFormatter.format);
                this.setColumns([nameColumn, orderColumn, compareStatusColumn, modifiedTimeColumn]);
            }
        };

        builder.setColumnUpdater(updateColumns);

        super(builder);

        this.setContextMenu(new TreeGridContextMenu(new ContentTreeGridActions(this)));

        this.initEventHandlers();
    }

    protected createToolbar() {
        return new ContentTreeGridToolbar(this);
    }

    protected editItem(node: TreeNode<ContentSummaryAndCompareStatus>) {
        if (this.getDataId(node.getData())) { // default event
            new EditContentEvent([node.getData()]).fire();
        }
    }

    private initEventHandlers() {
        this.getGrid().subscribeOnClick((event) => {
            let elem = new ElementHelper(event.target);
            if (elem.hasClass('sort-dialog-trigger')) {
                new SortContentEvent(this.getSelectedDataList()).fire();
            }
        });

        this.getGrid().subscribeOnDblClick((event, data) => {
            if (this.isActive()) {
                let node = this.getGrid().getDataView().getItem(data.row);
                if (!node.getData().isPendingDelete()) {
                    /*
                     * Empty node double-clicked. Additional %MAX_FETCH_SIZE%
                     * nodes will be loaded and displayed. If the any other
                     * node is clicked, edit event will be triggered by default.
                     */
                    this.editItem(node);
                }
            }
        });

        /*
         * Filter (search) events.
         */
        BrowseFilterSearchEvent.on((event) => {
            let contentQueryResult = <ContentQueryResult<ContentSummary, ContentSummaryJson>>event.getData().getContentQueryResult();
            let contentSummaries = contentQueryResult.getContents();
            let compareRequest = CompareContentRequest.fromContentSummaries(contentSummaries);
            this.filterQuery = event.getData().getContentQuery();
            compareRequest.sendAndParse().then((compareResults: CompareContentResults) => {
                let contents: ContentSummaryAndCompareStatus[] = ContentSummaryAndCompareStatusFetcher.updateCompareStatus(contentSummaries,
                    compareResults);
                ContentSummaryAndCompareStatusFetcher.updateReadOnly(contents).then(() => {
                    let metadata = contentQueryResult.getMetadata();
                    if (metadata.getTotalHits() > metadata.getHits()) {
                        contents.push(new ContentSummaryAndCompareStatus());
                    }
                    this.filter(contents);
                    this.getRoot().getCurrentRoot().setMaxChildren(metadata.getTotalHits());
                    this.notifyLoaded();
                });

            }).catch((reason: any) => {
                api.DefaultErrorHandler.handle(reason);
            }).done();
        });

        BrowseFilterResetEvent.on(() => {
            this.resetFilter();
        });
        BrowseFilterRefreshEvent.on(() => {
            this.notifyLoaded();
        });
        ActiveContentVersionSetEvent.on((event: ActiveContentVersionSetEvent) => {
            this.updateContentNode(event.getContentId());
        });

        this.onLoaded(() => {
            new ContentTreeGridLoadedEvent().fire();
        });
    }

    protected isClickOutsideGridViewport(clickedEl: HTMLElement) {
        if (super.isClickOutsideGridViewport(clickedEl)) {
            return true;
        }
        const element = api.dom.Element.fromHtmlElement(clickedEl);
        return element.hasClass('content-item-preview-panel');
    }

    isEmptyNode(node: TreeNode<ContentSummaryAndCompareStatus>): boolean {
        const data = node.getData();
        return !data.getContentSummary() && !data.getUploadItem();
    }

    hasChildren(data: ContentSummaryAndCompareStatus): boolean {
        return data.hasChildren();
    }

    getDataId(data: ContentSummaryAndCompareStatus): string {
        return data.getId();
    }

    fetch(node: TreeNode<ContentSummaryAndCompareStatus>, dataId?: string): wemQ.Promise<ContentSummaryAndCompareStatus> {
        return this.fetchById(node.getData().getContentId());
    }

    private fetchById(id: api.content.ContentId): wemQ.Promise<ContentSummaryAndCompareStatus> {
        return ContentSummaryAndCompareStatusFetcher.fetch(id);
    }

    fetchChildren(parentNode?: TreeNode<ContentSummaryAndCompareStatus>): wemQ.Promise<ContentSummaryAndCompareStatus[]> {
        let parentContentId: api.content.ContentId = null;
        if (parentNode) {
            parentContentId = parentNode.getData() ? parentNode.getData().getContentId() : parentContentId;
        } else {
            parentNode = this.getRoot().getCurrentRoot();
        }
        let from = parentNode.getChildren().length;
        if (from > 0 && !parentNode.getChildren()[from - 1].getData().getContentSummary()) {
            parentNode.getChildren().pop();
            from -= 1;
        }

        if (!this.isFiltered() || parentNode !== this.getRoot().getCurrentRoot()) {
            return ContentSummaryAndCompareStatusFetcher.fetchChildren(parentContentId, from, ContentTreeGrid.MAX_FETCH_SIZE).then(
                (data: ContentResponse<ContentSummaryAndCompareStatus>) => {
                    // TODO: Will reset the ids and the selection for child nodes.
                    let contents = parentNode.getChildren().map((el) => {
                        return el.getData();
                    }).slice(0, from).concat(data.getContents());
                    let meta = data.getMetadata();
                    parentNode.setMaxChildren(meta.getTotalHits());
                    if (from + meta.getHits() < meta.getTotalHits()) {
                        contents.push(new ContentSummaryAndCompareStatus());
                    }
                    return contents;
                });
        } else {
            this.filterQuery.setFrom(from);
            this.filterQuery.setSize(ContentTreeGrid.MAX_FETCH_SIZE);
            return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(this.filterQuery).setExpand(
                api.rest.Expand.SUMMARY).sendAndParse().then(
                (contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                    let contentSummaries = contentQueryResult.getContents();
                    let compareRequest = CompareContentRequest.fromContentSummaries(contentSummaries);
                    return compareRequest.sendAndParse().then((compareResults: CompareContentResults) => {
                        let contents = parentNode.getChildren().map((el) => {
                            return el.getData();
                        }).slice(0, from).concat(ContentSummaryAndCompareStatusFetcher.updateCompareStatus(contentSummaries,
                            compareResults));

                        return ContentSummaryAndCompareStatusFetcher.updateReadOnly(contents).then(() => {
                            let meta = contentQueryResult.getMetadata();
                            if (from + meta.getHits() < meta.getTotalHits()) {
                                contents.push(new ContentSummaryAndCompareStatus());
                            }
                            parentNode.setMaxChildren(meta.getTotalHits());
                            return contents;
                        });

                    });
                });
        }
    }

    fetchChildrenIds(parentNode?: TreeNode<ContentSummaryAndCompareStatus>): wemQ.Promise<ContentId[]> {
        let parentContentId: api.content.ContentId = null;
        if (parentNode) {
            parentContentId = parentNode.getData() ? parentNode.getData().getContentId() : parentContentId;
        } else {
            parentNode = this.getRoot().getCurrentRoot();
        }
        let size = parentNode.getChildren().length;
        if (size > 0 && !parentNode.getChildren()[size - 1].getData().getContentSummary()) {
            parentNode.getChildren().pop();
            size--;
        }

        if (!this.isFiltered() || parentNode !== this.getRoot().getCurrentRoot()) {
            return ContentSummaryAndCompareStatusFetcher.fetchChildrenIds(parentContentId).then(
                (response: ContentId[]) => {
                    return response;
                });
        } else {
            this.filterQuery.setFrom(0);
            this.filterQuery.setSize(size + 1);
            return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(this.filterQuery).setExpand(
                api.rest.Expand.SUMMARY).sendAndParse().then(
                (contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                    return contentQueryResult.getContents().map((content => content.getContentId()));
                });
        }
    }

    deleteNodes(dataList: ContentSummaryAndCompareStatus[]): void {
        let root = this.getRoot().getCurrentRoot();
        let node: TreeNode<ContentSummaryAndCompareStatus>;

        // Do not remove the items, that is not new and switched to 'PENDING_DELETE'
        dataList = dataList.filter((data) => {
            node = root.findNode(this.getDataId(data));
            if (node.getData().getCompareStatus() !== CompareStatus.NEW) {
                node.clearViewers();
                return false;
            }
            return true;
        });
        super.deleteNodes(dataList);
    }

    appendUploadNode(item: api.ui.uploader.UploadItem<ContentSummary>) {
        const data: ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatus.fromUploadItem(item);
        const parent: TreeNode<ContentSummaryAndCompareStatus> = this.getRoot().getCurrentSelection()[0];

        this.appendNode(data, false).then(() => {
            if (parent) {
                let parentData = parent.getData();
                let contentSummary = new ContentSummaryBuilder(parentData.getContentSummary()).setHasChildren(true).build();
                this.updateNode(parentData.setContentSummary(contentSummary));
                this.expandNode(parent);
            }
        }).done();

        item.onProgress((progress: number) => {
            this.invalidate();
        });
        item.onUploaded((model: ContentSummary) => {
            let nodeToRemove = this.getRoot().getCurrentRoot().findNode(item.getId());
            if (nodeToRemove) {
                nodeToRemove.remove();
                this.invalidate();
            }

            api.notify.showFeedback(i18n('notify.item.created', data.getContentSummary().getType().toString(), item.getName()));
        });
        item.onFailed(() => {
            this.deleteNode(data);
        });
    }

    refreshNodeData(parentNode: TreeNode<ContentSummaryAndCompareStatus>): wemQ.Promise<TreeNode<ContentSummaryAndCompareStatus>> {
        return ContentSummaryAndCompareStatusFetcher.fetch(parentNode.getData().getContentId()).then(
            (content: ContentSummaryAndCompareStatus) => {
                parentNode.setData(content);
                this.refreshNode(parentNode);
                return parentNode;
            });
    }

    sortNodeChildren(node: TreeNode<ContentSummaryAndCompareStatus>) {
        let rootNode = this.getRoot().getCurrentRoot();
        if (node !== rootNode) {
            if (node.hasChildren()) {
                node.setChildren([]);
                node.setMaxChildren(0);

                this.fetchChildren(node)
                    .then((dataList: ContentSummaryAndCompareStatus[]) => {
                        let parentNode = this.getRoot().getCurrentRoot().findNode(node.getDataId());
                        parentNode.setChildren(this.dataToTreeNodes(dataList, parentNode));
                        let rootList = this.getRoot().getCurrentRoot().treeToList();
                        this.initData(rootList);
                    }).catch((reason: any) => {
                    api.DefaultErrorHandler.handle(reason);
                }).done();
            }
        }
    }

    selectAll() {
        this.getGrid().mask();
        setTimeout(() => {
            super.selectAll();
            this.getGrid().unmask();
        }, 5);
    }

    private findByPaths(paths: api.content.ContentPath[], useParent: boolean = false): TreeNodesOfContentPath[] {
        const root: TreeNode<ContentSummaryAndCompareStatus>[] = this.getRoot().getDefaultRoot().treeToList(false, false);
        const filter: TreeNode<ContentSummaryAndCompareStatus>[] = this.getRoot().getFilteredRoot().treeToList(false, false);
        const all: TreeNode<ContentSummaryAndCompareStatus>[] = root.concat(filter);
        const result: TreeNodesOfContentPath[] = [];
        const resultIds: string[] = [];

        for (let i = 0; i < paths.length; i++) {
            const node = useParent
                ? new TreeNodesOfContentPath(paths[i].getParentPath(), paths[i])
                : new TreeNodesOfContentPath(paths[i]);

            if (useParent && node.getPath().isRoot()) {
                node.getNodes().push(this.getRoot().getDefaultRoot());
                if (this.isFiltered()) {
                    node.getNodes().push(this.getRoot().getFilteredRoot());
                }
            } else {
                for (let j = 0; j < all.length; j++) {
                    let treeNode = all[j];
                    let path = (treeNode.getData() && treeNode.getData().getContentSummary())
                        ? treeNode.getData().getContentSummary().getPath()
                        : null;
                    if (path && path.equals(node.getPath())) {
                        node.getNodes().push(treeNode);
                    }
                }
            }

            if (node.hasNodes()) {
                if (resultIds.indexOf(node.getId()) < 0) {
                    result.push(node);
                    resultIds.push(node.getId());
                }
            }
        }

        return result;
    }

    selectNodeByPath(targetPath: ContentPath) {
        let currentSelectedNode: TreeNode<ContentSummaryAndCompareStatus> = this.getFirstSelectedOrHighlightedNode();
        let nodeToSearchTargetIn: TreeNode<ContentSummaryAndCompareStatus>;

        if (currentSelectedNode && targetPath.isDescendantOf(currentSelectedNode.getData().getPath())) {
            nodeToSearchTargetIn = currentSelectedNode;
        } else {
            nodeToSearchTargetIn = this.getRoot().getCurrentRoot();
        }

        // go down and expand path's parents level by level until we reach the desired element within the list of fetched children
        this.doSelectNodeByPath(nodeToSearchTargetIn, targetPath);
    }

    private doSelectNodeByPath(nodeToSearchTargetIn: TreeNode<ContentSummaryAndCompareStatus>, targetPath: ContentPath) {
        this.expandNode(nodeToSearchTargetIn).then(() => {
            // if true means one of direct children of node is searched target node
            if (this.isTargetNodeLevelReached(nodeToSearchTargetIn, targetPath)) {
                this.findChildNodeByPath(nodeToSearchTargetIn, targetPath).then((targetNode) => {
                    this.selectNode(targetNode.getDataId());
                    this.scrollToRow(this.getGrid().getDataView().getRowById(targetNode.getId()));
                });
            } else {
                let nextLevelChildPath = targetPath.getPathAtLevel(!!nodeToSearchTargetIn.getData()
                    ? nodeToSearchTargetIn.getData().getPath().getLevel() + 1
                    : 1);
                this.findChildNodeByPath(nodeToSearchTargetIn, nextLevelChildPath).then((targetNode) => {
                    this.doSelectNodeByPath(targetNode, targetPath);
                });
            }
        }).catch((reason: any) => {
            this.handleError(reason);
        }).done();
    }

    private isTargetNodeLevelReached(nodeToSearchTargetIn: TreeNode<ContentSummaryAndCompareStatus>, targetPath: ContentPath): boolean {
        let nodeToExpandLevel = !!nodeToSearchTargetIn.getData() ? nodeToSearchTargetIn.getData().getPath().getLevel() : 0;
        let targetNodeLevelReached = (targetPath.getLevel() - 1) === nodeToExpandLevel;

        return targetNodeLevelReached;
    }

    private findChildNodeByPath(node: TreeNode<ContentSummaryAndCompareStatus>,
                                childNodePath: ContentPath): wemQ.Promise<TreeNode<ContentSummaryAndCompareStatus>> {
        let childNode = this.doFindChildNodeByPath(node, childNodePath);

        if (childNode) {
            return wemQ.resolve(childNode);
        }

        return this.waitChildrenLoadedAndFindChildNodeByPath(node, childNodePath);
    }

    private doFindChildNodeByPath(node: TreeNode<ContentSummaryAndCompareStatus>,
                                  childNodePath: ContentPath): TreeNode<ContentSummaryAndCompareStatus> {
        const children = node.getChildren();
        for (let i = 0; i < children.length; i++) {
            const childPath = children[i].getData().getPath();

            if (childPath && childPath.equals(childNodePath)) {
                return children[i];
            }
        }

        // scrolling to last child of node to make node load the rest
        let child: TreeNode<ContentSummaryAndCompareStatus> = children[children.length - 1];
        this.scrollToRow(this.getGrid().getDataView().getRowById(child.getId()));

        return null;
    }

    private waitChildrenLoadedAndFindChildNodeByPath(node: TreeNode<ContentSummaryAndCompareStatus>,
                                                     childNodePath: ContentPath): wemQ.Promise<TreeNode<ContentSummaryAndCompareStatus>> {
        let deferred = wemQ.defer<TreeNode<ContentSummaryAndCompareStatus>>();

        let dateChangedHandler = () => {
            const childNode = this.doFindChildNodeByPath(node, childNodePath);
            if (childNode) {
                this.unDataChanged(dateChangedHandler);
                deferred.resolve(this.doFindChildNodeByPath(node, childNodePath));
            }
        };

        this.onDataChanged(dateChangedHandler);

        dateChangedHandler();

        return deferred.promise;
    }

    private updateContentNode(contentId: api.content.ContentId) {
        const root: TreeNode<ContentSummaryAndCompareStatus> = this.getRoot().getCurrentRoot();
        const treeNode: TreeNode<ContentSummaryAndCompareStatus> = root.findNode(contentId.toString());
        if (treeNode) {
            const content: ContentSummaryAndCompareStatus = treeNode.getData();
            this.updateNode(ContentSummaryAndCompareStatus.fromContentSummary(content.getContentSummary()));
        }
    }

    private appendContentNode(parentNode: TreeNode<ContentSummaryAndCompareStatus>, childData: ContentSummaryAndCompareStatus,
                              index: number,
                              update: boolean = true): TreeNode<ContentSummaryAndCompareStatus> {
        const appendedNode: TreeNode<ContentSummaryAndCompareStatus> = this.dataToTreeNode(childData, parentNode);
        const data: ContentSummaryAndCompareStatus = parentNode.getData();

        if (!parentNode.hasParent() ||
            (data && parentNode.hasChildren()) ||
            (data && !parentNode.hasChildren() && !data.getContentSummary().hasChildren())) {
            parentNode.insertChild(appendedNode, index);
        }

        if (data && !data.getContentSummary().hasChildren()) {
            data.setContentSummary(new ContentSummaryBuilder(data.getContentSummary()).setHasChildren(true).build());
        }

        parentNode.clearViewers();

        if (update) {
            this.initAndRender();
        }

        return appendedNode;
    }

    private appendContentNodes(relationships: TreeNodeParentOfContent[]): wemQ.Promise<TreeNode<ContentSummaryAndCompareStatus>[]> {
        const deferred = wemQ.defer<TreeNode<ContentSummaryAndCompareStatus>[]>();
        const parallelPromises: wemQ.Promise<TreeNode<ContentSummaryAndCompareStatus>[]>[] = [];
        const result: TreeNode<ContentSummaryAndCompareStatus>[] = [];

        relationships.forEach((relationship) => {
            parallelPromises.push(this.fetchChildrenIds(relationship.getNode()).then((contentIds: ContentId[]) => {
                relationship.getChildren().forEach((content: ContentSummaryAndCompareStatus) => {
                    result.push(this.appendContentNode(relationship.getNode(), content, contentIds.indexOf(content.getContentId()), false));
                });
                return result;
            }));
        });

        wemQ.all(parallelPromises).then(() => {
            deferred.resolve(result);
        });
        return deferred.promise;
    }

    private placeContentNode(parent: TreeNode<ContentSummaryAndCompareStatus>,
                             child: TreeNode<ContentSummaryAndCompareStatus>): wemQ.Promise<TreeNode<ContentSummaryAndCompareStatus>> {
        return this.fetchChildrenIds(parent).then((result: ContentId[]) => {
            const map = result.map((el) => {
                return el.toString();
            });
            const index: number = map.indexOf(child.getData().getId());

            if (!parent.hasParent() ||
                (child.getData() && parent.hasChildren()) ||
                (child.getData() && !parent.hasChildren() && !child.getData().getContentSummary().hasChildren())) {
                let parentExpanded = parent.isExpanded();
                parent.moveChild(child, index);
                parent.setExpanded(parentExpanded); // in case of a single child it forces its parent to stay expanded
            }

            child.clearViewers();

            return child;

        });
    }

    placeContentNodes(nodes: TreeNode<ContentSummaryAndCompareStatus>[]): wemQ.Promise<any> {
        const parallelPromises: wemQ.Promise<any>[] = [];

        nodes.forEach((node: TreeNode<ContentSummaryAndCompareStatus>) => {
            parallelPromises.push(this.placeContentNode(node.getParent(), node));
        });

        return wemQ.allSettled(parallelPromises).then((results) => {
            let rootList = this.getRoot().getCurrentRoot().treeToList();
            this.initData(rootList);
            this.invalidate();
            return results;
        });
    }

    private deleteContentNode(node: TreeNode<ContentSummaryAndCompareStatus>,
                              update: boolean = true): TreeNode<ContentSummaryAndCompareStatus> {
        const parentNode: TreeNode<ContentSummaryAndCompareStatus> = node.getParent();

        if (this.isNodeHighlighted(node)) {
            this.removeHighlighting();
        }

        node.remove();

        const data: ContentSummaryAndCompareStatus = parentNode ? parentNode.getData() : null;
        if (data && !parentNode.hasChildren() && data.getContentSummary().hasChildren()) {
            data.setContentSummary(new ContentSummaryBuilder(data.getContentSummary()).setHasChildren(false).build());
        }

        if (update) {
            this.initAndRender();
        }

        return parentNode;
    }

    deleteContentNodes(paths: ContentPath[]): TreeNode<ContentSummaryAndCompareStatus>[] {
        const nodes: TreeNode<ContentSummaryAndCompareStatus>[] = this.getNodes(paths);
        this.deselectDeletedNodes(nodes);

        nodes.forEach((node) => {
            this.deleteContentNode(node, false);
        });

        this.initAndRender();
        this.updateNodesHasChildren(paths);

        return nodes;
    }

    private getNodes(paths: ContentPath[]): TreeNode<ContentSummaryAndCompareStatus>[] {
        const nodes: TreeNode<ContentSummaryAndCompareStatus>[][] = this.findByPaths(paths).map(el => el.getNodes());
        const merged: TreeNode<ContentSummaryAndCompareStatus>[] = [];

        return merged.concat.apply(merged, nodes);
    }

    private deselectDeletedNodes(nodes: TreeNode<ContentSummaryAndCompareStatus>[]) {
        const nodesToDeselect: string[] = [];

        this.getSelectedDataList().forEach((content: ContentSummaryAndCompareStatus) => {
            const wasDeleted: boolean = nodes.some((node: TreeNode<ContentSummaryAndCompareStatus>) => {
                return content.getContentId().equals(node.getData().getContentId()) ||
                       content.getPath().isDescendantOf(node.getData().getPath());
            });

            if (wasDeleted) {
                nodesToDeselect.push(content.getId());
            }

        });

        this.deselectNodes(nodesToDeselect);
    }

    // update parent if all children were deleted
    private updateNodesHasChildren(paths: ContentPath[]) {
        this.getUniqueParentsNodes(paths)
            .filter((parentNode: TreeNode<ContentSummaryAndCompareStatus>) => parentNode.getChildren().length === 0)
            .forEach((parentNode: TreeNode<ContentSummaryAndCompareStatus>) => {
                this.refreshNodeData(parentNode);
            });
    }

    private getUniqueParentsNodes(paths: ContentPath[]): TreeNode<ContentSummaryAndCompareStatus>[] {
        const uniqueParents: ContentPath[] = paths.map(path => path.getParentPath()).filter((parent, index, self) => {
            return self.indexOf(parent) === index;
        });

        return this.getNodes(uniqueParents);
    }

    private updatePathsInChildren(node: TreeNode<ContentSummaryAndCompareStatus>) {
        node.getChildren().forEach((child) => {
            const nodeSummary: ContentSummary = node.getData() ? node.getData().getContentSummary() : null;
            const childSummary: ContentSummary = child.getData() ? child.getData().getContentSummary() : null;
            if (nodeSummary && childSummary) {
                const path: ContentPath = ContentPath.fromParent(nodeSummary.getPath(), childSummary.getPath().getName());
                child.getData().setContentSummary(new ContentSummaryBuilder(childSummary).setPath(path).build());
                child.clearViewers();
                this.updatePathsInChildren(child);
            }
        });
    }

    sortNodesChildren(data: ContentSummaryAndCompareStatus[]): wemQ.Promise<void> {
        const paths: api.content.ContentPath[] = data.map(d => d.getContentSummary().getPath());
        const nodes: TreeNode<ContentSummaryAndCompareStatus>[] = this.getNodes(paths);
        const parallelPromises: wemQ.Promise<any>[] = [];

        nodes.sort((a, b) => {
            return a.getDataId().localeCompare(b.getDataId());
        });

        let groups = [];
        let group = [];

        groups.push(group);

        for (let i = 0; i < nodes.length; i++) {
            if (!!group[group.length - 1] &&
                nodes[i].getDataId() !== group[group.length - 1].getDataId()) {
                group = [];
                groups.push(group);
            }

            group.push(nodes[i]);
        }

        groups.forEach((grp: TreeNode<ContentSummaryAndCompareStatus>[]) => {
            if (grp.length > 0) {
                parallelPromises.push(
                    this.updateNodes(grp[0].getData()).then(() => {
                        let hasChildren = grp[0].hasChildren();
                        grp[0].setChildren([]);
                        return this.fetchChildren(grp[0]).then((dataList: ContentSummaryAndCompareStatus[]) => {
                            grp.forEach((el) => {
                                if (hasChildren) {
                                    el.setChildren(this.dataToTreeNodes(dataList, el));
                                }
                            });
                        }).catch((reason: any) => {
                            api.DefaultErrorHandler.handle(reason);
                        });
                    }).then(() => {
                        let rootList = this.getRoot().getCurrentRoot().treeToList();
                        this.initData(rootList);
                    })
                );
            }
        });

        return wemQ.all(parallelPromises).spread<void>(() => {
            this.invalidate();
            return wemQ(null);
        }).catch((reason: any) => api.DefaultErrorHandler.handle(reason));
    }

    protected handleItemMetadata(row: number) {
        const node: TreeNode<ContentSummaryAndCompareStatus> = this.getItem(row);
        if (this.isEmptyNode(node)) {
            return {cssClasses: 'empty-node'};
        }

        if (node.getData().isReadOnly()) {
            return {cssClasses: `readonly' title='${i18n('field.readOnly')}'`};
        }

        return null;
    }

    getSelectedOrHighlightedItems(): TreeNode<ContentSummaryAndCompareStatus>[] {
        const selectedItems: TreeNode<ContentSummaryAndCompareStatus>[] = this.getRoot().getFullSelection();

        if (selectedItems.length > 0) {
            return selectedItems;
        }

        if (this.hasHighlightedNode()) {
            return [this.getFirstSelectedOrHighlightedNode()];
        }

        return [];
    }

    renameContentNodes(data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]): wemQ.Promise<void> {
        const nodes: TreeNodesOfContentPath[] = this.getContentNodes(data, true);
        const parentsOfContents: TreeNodeParentOfContent[] = [];

        for (let i = 0; i < nodes.length; i++) {
            this.processRenamedNodes(data, nodes[i].getPath(), oldPaths);
            nodes[i].getNodes().map((node) => {
                parentsOfContents.push(new TreeNodeParentOfContent([], node));
            });
        }

        return this.processContentCreated(parentsOfContents);
    }

    private getContentNodes(data: ContentSummaryAndCompareStatus[], useParent: boolean = false): TreeNodesOfContentPath[] {
        const paths: api.content.ContentPath[] = data.map(d => d.getPath());
        return this.findByPaths(paths, useParent);
    }

    private processRenamedNodes(data: ContentSummaryAndCompareStatus[], path: ContentPath, oldPaths: ContentPath[]) {
        data.filter((el) => el.getPath().isChildOf(path)).forEach((el) => {
            const movedNodes: TreeNode<ContentSummaryAndCompareStatus>[] = this.getNodes(oldPaths);
            this.updatePathsOfRenamedNodes(el, movedNodes);
            this.placeContentNodes(movedNodes);
        });
    }

    private updatePathsOfRenamedNodes(el: ContentSummaryAndCompareStatus, nodes: TreeNode<ContentSummaryAndCompareStatus>[]) {
        nodes.forEach((node) => {
            if (node.getDataId() === el.getId()) {
                node.setData(el);
                node.clearViewers();
                this.updatePathsInChildren(node);
            }
        });
    }

    private processContentCreated(nodes: TreeNodeParentOfContent[]): wemQ.Promise<void> {
        return this.appendContentNodes(nodes).then((results: TreeNode<ContentSummaryAndCompareStatus>[]) => {
            return this.placeContentNodes(this.getNodesThatShouldBeVisible(results)).then(() => {
                this.initAndRender();

                return wemQ(null);
            });
        });
    }

    private getNodesThatShouldBeVisible(items: TreeNode<ContentSummaryAndCompareStatus>[]): TreeNode<ContentSummaryAndCompareStatus>[] {
        const nodesThatShouldBeVisible: TreeNode<ContentSummaryAndCompareStatus>[] = [];

        items.forEach((appendedNode) => {
            if (appendedNode.getParent() && appendedNode.getParent().isExpanded()) {
                nodesThatShouldBeVisible.push(appendedNode);
            }
        });

        return nodesThatShouldBeVisible;
    }

    addContentNodes(data: ContentSummaryAndCompareStatus[]): wemQ.Promise<void> {
        return this.processContentCreated(this.getParentsOfCreatedContents(data));
    }

    private getParentsOfCreatedContents(data: ContentSummaryAndCompareStatus[]): TreeNodeParentOfContent[] {
        const createResult: TreeNodesOfContentPath[] = this.getContentNodes(data, true);
        const parentsOfContents: TreeNodeParentOfContent[] = [];

        for (let i = 0; i < createResult.length; i++) {
            const dataToHandle: ContentSummaryAndCompareStatus[] = [];

            data.filter((el) => el.getPath().isChildOf(createResult[i].getPath())).forEach((el) => {
                dataToHandle.push(el);
            });

            createResult[i].getNodes().map((node) => {
                parentsOfContents.push(new TreeNodeParentOfContent(dataToHandle, node));
            });
        }

        return parentsOfContents;
    }

    updateContentNodes(data: ContentSummaryAndCompareStatus[]): wemQ.Promise<TreeNode<ContentSummaryAndCompareStatus>[]> {
        const changed: TreeNode<ContentSummaryAndCompareStatus>[] = this.doUpdateContentNodes(data);
        this.invalidateNodes(changed);

        return wemQ(changed);
    }

    private doUpdateContentNodes(data: ContentSummaryAndCompareStatus[]): TreeNode<ContentSummaryAndCompareStatus>[] {
        const treeNodes: TreeNodesOfContentPath[] = this.getContentNodes(data);

        const changed: TreeNode<ContentSummaryAndCompareStatus>[] = [];
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

    selectInlinedContentInGrid(contentPath: ContentPath) {
        if (this.getFirstSelectedOrHighlightedNode() && !this.isGivenPathSelectedInGrid(contentPath)) {
            this.selectNodeByPath(contentPath);
        }
    }

    private isGivenPathSelectedInGrid(path: api.content.ContentPath): boolean {
        const node: TreeNode<ContentSummaryAndCompareStatus> = this.getFirstSelectedOrHighlightedNode();

        if (node) {
            const contentSummary: ContentSummaryAndCompareStatus = node.getData();
            return contentSummary.getPath().equals(path);
        }

        return false;
    }
}
