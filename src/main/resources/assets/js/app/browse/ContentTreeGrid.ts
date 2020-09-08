import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {ElementHelper} from 'lib-admin-ui/dom/ElementHelper';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Body} from 'lib-admin-ui/dom/Body';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary, ContentSummaryBuilder} from 'lib-admin-ui/content/ContentSummary';
import {SortContentEvent} from './sort/SortContentEvent';
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
import {ContentMetadata} from '../content/ContentMetadata';
import {TreeGrid} from 'lib-admin-ui/ui/treegrid/TreeGrid';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {TreeGridBuilder} from 'lib-admin-ui/ui/treegrid/TreeGridBuilder';
import {DateTimeFormatter} from 'lib-admin-ui/ui/treegrid/DateTimeFormatter';
import {TreeGridContextMenu} from 'lib-admin-ui/ui/treegrid/TreeGridContextMenu';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {ResponsiveRanges} from 'lib-admin-ui/ui/responsive/ResponsiveRanges';
import {BrowseFilterResetEvent} from 'lib-admin-ui/app/browse/filter/BrowseFilterResetEvent';
import {BrowseFilterRefreshEvent} from 'lib-admin-ui/app/browse/filter/BrowseFilterRefreshEvent';
import {BrowseFilterSearchEvent} from 'lib-admin-ui/app/browse/filter/BrowseFilterSearchEvent';
import {Expand} from 'lib-admin-ui/rest/Expand';
import {UploadItem} from 'lib-admin-ui/ui/uploader/UploadItem';
import {GridColumnConfig} from 'lib-admin-ui/ui/grid/GridColumn';
import {showFeedback} from 'lib-admin-ui/notify/MessageBus';

export enum State {
    ENABLED, DISABLED
}

export class ContentTreeGrid
    extends TreeGrid<ContentSummaryAndCompareStatus> {

    static MAX_FETCH_SIZE: number = 10;

    private filterQuery: ContentQuery;

    private state: State;

    constructor() {
        const builder: TreeGridBuilder<ContentSummaryAndCompareStatus> =
            new TreeGridBuilder<ContentSummaryAndCompareStatus>()
                .setColumnConfig(ContentTreeGrid.createColumnConfig())
                .setPartialLoadEnabled(true)
                .setLoadBufferSize(20)
                .prependClasses('content-tree-grid');

        const [
            nameColumn,
            compareStatusColumn,
            orderColumn,
            modifiedTimeColumn,
        ] = builder.getColumns().slice(0);

        const updateColumns = () => {
            const width: number = this.getEl().getWidth();
            const checkSelIsMoved: boolean = ResponsiveRanges._540_720.isFitOrSmaller(Body.get().getEl().getWidth());
            const curClass: string = nameColumn.getCssClass();

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

        this.state = State.ENABLED;
        this.setContextMenu(new TreeGridContextMenu(new ContentTreeGridActions(this)));

        this.initEventHandlers();
    }

    private static createColumnConfig(): GridColumnConfig[] {
        return [{
            name: 'Name',
            id: 'displayName',
            field: 'contentSummary.displayName',
            formatter: ContentRowFormatter.nameFormatter,
            style: {cssClass: 'name', minWidth: 130}
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
        }];
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
        this.getGrid().subscribeOnClick(this.handleGridClick.bind(this));
        this.getGrid().subscribeOnDblClick(this.handleGridDoubleClick.bind(this));

        /*
         * Filter (search) events.
         */
        BrowseFilterSearchEvent.on(this.handleBrowseFilterSearchEvent.bind(this));
        BrowseFilterResetEvent.on(this.resetFilter.bind(this));
        BrowseFilterRefreshEvent.on(this.notifyLoaded.bind(this));
        ActiveContentVersionSetEvent.on(this.handleActiveContentVersionSetEvent.bind(this));

        this.onLoaded(() => {
            new ContentTreeGridLoadedEvent().fire();
        });
    }

    private handleGridClick(event: any) {
        const elem: ElementHelper = new ElementHelper(event.target);
        if (elem.hasClass('sort-dialog-trigger')) {
            new SortContentEvent(this.getSelectedDataList()).fire();
        }
    }

    private handleGridDoubleClick(event: any, data: any) {
        if (this.isActive()) {
            const node: TreeNode<ContentSummaryAndCompareStatus> = this.getGrid().getDataView().getItem(data.row);
            if (!node.getData().isPendingDelete()) {
                /*
                 * Empty node double-clicked. Additional %MAX_FETCH_SIZE%
                 * nodes will be loaded and displayed. If the any other
                 * node is clicked, edit event will be triggered by default.
                 */
                this.editItem(node);
            }
        }
    }

    private handleBrowseFilterSearchEvent(event: BrowseFilterSearchEvent<any>) {
        const contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson> = event.getData().getContentQueryResult();
        const contentSummaries: ContentSummary[] = contentQueryResult.getContents();
        const compareRequest: CompareContentRequest = CompareContentRequest.fromContentSummaries(contentSummaries);
        this.filterQuery = event.getData().getContentQuery();
        compareRequest.sendAndParse().then((compareResults: CompareContentResults) => {
            const contents: ContentSummaryAndCompareStatus[] = ContentSummaryAndCompareStatusFetcher.updateCompareStatus(contentSummaries,
                compareResults);
            ContentSummaryAndCompareStatusFetcher.updateReadOnly(contents).then(() => {
                const metadata: ContentMetadata = contentQueryResult.getMetadata();
                if (this.isEmptyNodeNeeded(metadata)) {
                    contents.push(new ContentSummaryAndCompareStatus());
                }
                this.filter(contents);
                this.getRoot().getCurrentRoot().setMaxChildren(metadata.getTotalHits());
                this.notifyLoaded();
            });

        }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        }).done();
    }

    private handleActiveContentVersionSetEvent(event: ActiveContentVersionSetEvent) {
        const root: TreeNode<ContentSummaryAndCompareStatus> = this.getRoot().getCurrentRoot();
        const treeNode: TreeNode<ContentSummaryAndCompareStatus> = root.findNode(event.getContentId().toString());
        if (treeNode) {
            const content: ContentSummaryAndCompareStatus = treeNode.getData();
            this.updateNode(ContentSummaryAndCompareStatus.fromContentSummary(content.getContentSummary()));
        }
    }

    protected isClickOutsideGridViewport(clickedEl: HTMLElement) {
        if (super.isClickOutsideGridViewport(clickedEl)) {
            return true;
        }
        const element: Element = Element.fromHtmlElement(clickedEl);
        return element.hasClass('content-item-preview-panel');
    }

    setState(state: State) {
        this.state = state;

        if (this.state === State.ENABLED) {
            this.getToolbar().enable();
            this.enableKeys();
        } else {
            this.getToolbar().disable();
            this.disableKeys();
        }
    }

    reload(parentNodeData?: ContentSummaryAndCompareStatus, _idPropertyName?: string, rememberExpanded: boolean = true): Q.Promise<void> {
        if (this.state === State.DISABLED) {
            return Q(null);
        }

        return super.reload(parentNodeData, _idPropertyName, rememberExpanded);
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

    fetch(node: TreeNode<ContentSummaryAndCompareStatus>, dataId?: string): Q.Promise<ContentSummaryAndCompareStatus> {
        return this.fetchById(node.getData().getContentId());
    }

    private fetchById(id: ContentId): Q.Promise<ContentSummaryAndCompareStatus> {
        return ContentSummaryAndCompareStatusFetcher.fetch(id);
    }

    fetchChildren(parentNode?: TreeNode<ContentSummaryAndCompareStatus>): Q.Promise<ContentSummaryAndCompareStatus[]> {
        if (!parentNode || this.isRootNode(parentNode)) {
            return this.fetchRoot();
        } else {
            return this.doFetchChildren(parentNode);
        }
    }

    private isRootNode(node: TreeNode<ContentSummaryAndCompareStatus>): boolean {
        return !node.hasParent();
    }

    fetchRoot(): Q.Promise<ContentSummaryAndCompareStatus[]> {
        const root: TreeNode<ContentSummaryAndCompareStatus> = this.getRoot().getCurrentRoot();

        this.removeEmptyNode(root);

        if (this.isFiltered()) {
            return this.fetchFilteredContents(root);
        }

        return this.fetchRootContents(root);
    }

    private removeEmptyNode(node: TreeNode<ContentSummaryAndCompareStatus>) {
        if (node.hasChildren() && this.isEmptyNode(node.getChildren()[node.getChildren().length - 1])) {
            node.getChildren().pop();
        }
    }

    private fetchRootContents(root: TreeNode<ContentSummaryAndCompareStatus>): Q.Promise<ContentSummaryAndCompareStatus[]> {
        const from: number = root.getChildren().length;

        return ContentSummaryAndCompareStatusFetcher.fetchRoot(from, ContentTreeGrid.MAX_FETCH_SIZE).then(
            (data: ContentResponse<ContentSummaryAndCompareStatus>) => {
                return this.processContentResponse(root, data, from);
            });
    }

    private processContentResponse(node: TreeNode<ContentSummaryAndCompareStatus>, data: ContentResponse<ContentSummaryAndCompareStatus>,
                                   from: number): ContentSummaryAndCompareStatus[] {
        const contents: ContentSummaryAndCompareStatus[] = node.getChildren().map((el) => {
            return el.getData();
        }).slice(0, from).concat(data.getContents());

        const meta: ContentMetadata = data.getMetadata();
        node.setMaxChildren(meta.getTotalHits());
        if (this.isEmptyNodeNeeded(meta, from)) {
            contents.push(new ContentSummaryAndCompareStatus());
        }

        return contents;
    }

    private isEmptyNodeNeeded(meta: ContentMetadata, from: number = 0): boolean {
        return from + meta.getHits() < meta.getTotalHits();
    }

    private fetchFilteredContents(node: TreeNode<ContentSummaryAndCompareStatus>): Q.Promise<ContentSummaryAndCompareStatus[]> {
        const from: number = node.getChildren().length;

        return this.sendContentQueryRequest(from, ContentTreeGrid.MAX_FETCH_SIZE).then(
            (contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                return this.processContentQueryResponse(node, contentQueryResult, from);
            });
    }

    private sendContentQueryRequest(from: number, size: number): Q.Promise<ContentQueryResult<ContentSummary, ContentSummaryJson>> {
        this.filterQuery.setFrom(from).setSize(size);

        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(this.filterQuery).setExpand(Expand.SUMMARY).sendAndParse();
    }

    private processContentQueryResponse(node: TreeNode<ContentSummaryAndCompareStatus>,
                                        data: ContentQueryResult<ContentSummary, ContentSummaryJson>,
                                        from: number): Q.Promise<ContentSummaryAndCompareStatus[]> {
        const contentSummaries: ContentSummary[] = data.getContents();
        const compareRequest: CompareContentRequest = CompareContentRequest.fromContentSummaries(contentSummaries);

        return compareRequest.sendAndParse().then((compareResults: CompareContentResults) => {
            const contents: ContentSummaryAndCompareStatus[] = node.getChildren().map((el) => {
                return el.getData();
            }).slice(0, from).concat(ContentSummaryAndCompareStatusFetcher.updateCompareStatus(contentSummaries,
                compareResults));

            return ContentSummaryAndCompareStatusFetcher.updateReadOnly(contents).then(() => {
                const meta: ContentMetadata = data.getMetadata();
                if (this.isEmptyNodeNeeded(meta, from)) {
                    contents.push(new ContentSummaryAndCompareStatus());
                }
                node.setMaxChildren(meta.getTotalHits());
                return contents;
            });

        });
    }

    private doFetchChildren(parentNode: TreeNode<ContentSummaryAndCompareStatus>): Q.Promise<ContentSummaryAndCompareStatus[]> {
        this.removeEmptyNode(parentNode);

        return this.fetchChildrenContents(parentNode);
    }

    private fetchChildrenContents(parentNode: TreeNode<ContentSummaryAndCompareStatus>): Q.Promise<ContentSummaryAndCompareStatus[]> {
        const parentContentId: ContentId = parentNode.getData().getContentId();
        const from: number = parentNode.getChildren().length;

        return ContentSummaryAndCompareStatusFetcher.fetchChildren(parentContentId, from, ContentTreeGrid.MAX_FETCH_SIZE).then(
            (data: ContentResponse<ContentSummaryAndCompareStatus>) => {
                return this.processContentResponse(parentNode, data, from);
            });
    }

    private fetchChildrenIds(parentNode: TreeNode<ContentSummaryAndCompareStatus>): Q.Promise<ContentId[]> {
        this.removeEmptyNode(parentNode);

        if (!this.isFiltered() || parentNode !== this.getRoot().getCurrentRoot()) {
            const parentContentId: ContentId = parentNode.getData() ? parentNode.getData().getContentId() : null;
            return ContentSummaryAndCompareStatusFetcher.fetchChildrenIds(parentContentId);
        } else {
            const size: number = parentNode.getChildren().length + 1;
            return this.sendContentQueryRequest(0, size).then(this.getContentIDsFromContentQueryResult.bind(this));
        }
    }

    private getContentIDsFromContentQueryResult(queryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>): ContentId[] {
        return queryResult.getContents().map((content => content.getContentId()));
    }

    deleteNodes(dataList: ContentSummaryAndCompareStatus[]): void {
        const root: TreeNode<ContentSummaryAndCompareStatus> = this.getRoot().getCurrentRoot();

        // Do not remove the items, that is not new and switched to 'PENDING_DELETE'
        dataList = dataList.filter((data) => {
            const node: TreeNode<ContentSummaryAndCompareStatus> = root.findNode(this.getDataId(data));
            if (node.getData().getCompareStatus() !== CompareStatus.NEW) {
                node.clearViewers();
                return false;
            }
            return true;
        });
        super.deleteNodes(dataList);
    }

    appendUploadNode(item: UploadItem<ContentSummary>) {
        const data: ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatus.fromUploadItem(item);
        const parent: TreeNode<ContentSummaryAndCompareStatus> = this.getFirstSelectedNode();

        this.appendNode(data, false).then(() => {
            if (parent) {
                this.updateUploadNodeParent(parent);
            }
        }).done();

        this.addUploadItemListeners(item, data);
    }

    private updateUploadNodeParent(parent: TreeNode<ContentSummaryAndCompareStatus>) {
        const parentData: ContentSummaryAndCompareStatus = parent.getData();
        const contSummary: ContentSummary = new ContentSummaryBuilder(parentData.getContentSummary()).setHasChildren(true).build();
        this.updateNode(parentData.setContentSummary(contSummary));
        this.expandNode(parent);
    }

    private addUploadItemListeners(uploadItem: UploadItem<ContentSummary>, data: ContentSummaryAndCompareStatus) {
        uploadItem.onProgress(this.invalidate.bind(this));
        uploadItem.onUploaded((model: ContentSummary) => {
            const nodeToRemove: TreeNode<ContentSummaryAndCompareStatus> = this.getRoot().getCurrentRoot().findNode(uploadItem.getId());
            if (nodeToRemove) {
                nodeToRemove.remove();
                this.invalidate();
            }

            showFeedback(i18n('notify.item.created', data.getContentSummary().getType().toString(), uploadItem.getName()));
        });
        uploadItem.onFailed(() => {
            this.deleteNode(data);
        });
    }

    refreshNodeData(parentNode: TreeNode<ContentSummaryAndCompareStatus>): Q.Promise<TreeNode<ContentSummaryAndCompareStatus>> {
        return ContentSummaryAndCompareStatusFetcher.fetch(parentNode.getData().getContentId()).then(
            (content: ContentSummaryAndCompareStatus) => {
                parentNode.setData(content);
                this.refreshNode(parentNode);
                return parentNode;
            });
    }

    sortNodeChildren(node: TreeNode<ContentSummaryAndCompareStatus>) {
        if (this.isSortableNode(node)) {
            this.doSortNodeChildren(node);
        }
    }

    private isSortableNode(node: TreeNode<ContentSummaryAndCompareStatus>): boolean {
        if (!node.hasChildren()) {
            return false;
        }

        if (node === this.getRoot().getCurrentRoot()) {
            return false;
        }

        return true;
    }

    private doSortNodeChildren(node: TreeNode<ContentSummaryAndCompareStatus>) {
        node.setChildren([]);
        node.setMaxChildren(0);

        this.fetchChildren(node).then((dataList: ContentSummaryAndCompareStatus[]) => {
            const parentNode: TreeNode<ContentSummaryAndCompareStatus> = this.getRoot().getCurrentRoot().findNode(node.getDataId());
            parentNode.setChildren(this.dataToTreeNodes(dataList, parentNode));
            this.reInitData();
        }).catch(DefaultErrorHandler.handle).done();
    }

    private reInitData() {
        const rootList: TreeNode<ContentSummaryAndCompareStatus>[] = this.getRoot().getCurrentRoot().treeToList();
        this.initData(rootList);
    }

    selectAll() {
        this.getGrid().mask();
        setTimeout(() => {
            super.selectAll();
            this.getGrid().unmask();
        }, 5);
    }

    private findByPaths(paths: ContentPath[]): TreeNodesOfContentPath[] {
        const allNodes: TreeNode<ContentSummaryAndCompareStatus>[] = this.getAllNodes();
        const result: TreeNodesOfContentPath[] = [];
        const resultIds: string[] = [];

        paths.map((pathToFind: ContentPath) => this.findByPath(allNodes, pathToFind))
            .filter((node: TreeNodesOfContentPath) => node.hasNodes() && (resultIds.indexOf(node.getId()) < 0))
            .forEach((node: TreeNodesOfContentPath) => {
                result.push(node);
                resultIds.push(node.getId());
            });

        return result;
    }

    getAllNodes(): TreeNode<ContentSummaryAndCompareStatus>[] {
        const root: TreeNode<ContentSummaryAndCompareStatus>[] = this.getRoot().getDefaultRoot().treeToList(false, false);
        const filter: TreeNode<ContentSummaryAndCompareStatus>[] = this.getRoot().getFilteredRoot().treeToList(false, false);
        return root.concat(filter);
    }

    private findByPath(treeNodes: TreeNode<ContentSummaryAndCompareStatus>[], pathToFind: ContentPath): TreeNodesOfContentPath {
        const node: TreeNodesOfContentPath = new TreeNodesOfContentPath(pathToFind);

        treeNodes.forEach((treeNode: TreeNode<ContentSummaryAndCompareStatus>) => {
            const treeNodePath: ContentPath = this.getPathFromNode(treeNode);
            if (treeNodePath && treeNodePath.equals(pathToFind)) {
                node.getNodes().push(treeNode);
            }
        });

        return node;
    }

    private getPathFromNode(node: TreeNode<ContentSummaryAndCompareStatus>): ContentPath {
        if (!node.hasData()) {
            return null;
        }

        if (!node.getData().getContentSummary()) {
            return null;
        }

        return node.getData().getContentSummary().getPath();
    }

    private findParentsByPaths(paths: ContentPath[]): TreeNodesOfContentPath[] {
        const allNodes: TreeNode<ContentSummaryAndCompareStatus>[] = this.getAllNodes();
        const result: TreeNodesOfContentPath[] = [];
        const resultIds: string[] = [];

        paths.map((pathToFind: ContentPath) => this.findParentByPath(allNodes, pathToFind))
            .filter((node: TreeNodesOfContentPath) => node.hasNodes() && (resultIds.indexOf(node.getId()) < 0))
            .forEach((node: TreeNodesOfContentPath) => {
                result.push(node);
                resultIds.push(node.getId());
            });

        return result;
    }

    private findParentByPath(treeNodes: TreeNode<ContentSummaryAndCompareStatus>[], path: ContentPath): TreeNodesOfContentPath {
        const parentPath: ContentPath = path.getParentPath();
        const node: TreeNodesOfContentPath = new TreeNodesOfContentPath(parentPath);

        if (node.getPath().isRoot()) {
            node.getNodes().push(this.getRoot().getDefaultRoot());
            if (this.isFiltered()) {
                node.getNodes().push(this.getRoot().getFilteredRoot());
            }
        } else {
            treeNodes.forEach((treeNode: TreeNode<ContentSummaryAndCompareStatus>) => {
                const treeNodePath: ContentPath = this.getPathFromNode(treeNode);
                if (treeNodePath && treeNodePath.equals(parentPath)) {
                    node.getNodes().push(treeNode);
                }
            });
        }

        return node;
    }

    private selectNodeByPath(targetPath: ContentPath) {
        const currentSelectedNode: TreeNode<ContentSummaryAndCompareStatus> = this.getFirstSelectedOrHighlightedNode();
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
                const nextLevelChildPath: ContentPath = targetPath.getPathAtLevel(!!nodeToSearchTargetIn.getData()
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
        const nodeToExpandLevel: number = !!nodeToSearchTargetIn.getData() ? nodeToSearchTargetIn.getData().getPath().getLevel() : 0;
        const targetNodeLevelReached: boolean = (targetPath.getLevel() - 1) === nodeToExpandLevel;

        return targetNodeLevelReached;
    }

    private findChildNodeByPath(node: TreeNode<ContentSummaryAndCompareStatus>,
                                childNodePath: ContentPath): Q.Promise<TreeNode<ContentSummaryAndCompareStatus>> {
        const childNode: TreeNode<ContentSummaryAndCompareStatus> = this.doFindChildNodeByPath(node, childNodePath);

        if (childNode) {
            return Q.resolve(childNode);
        }

        return this.waitChildrenLoadedAndFindChildNodeByPath(node, childNodePath);
    }

    private doFindChildNodeByPath(node: TreeNode<ContentSummaryAndCompareStatus>,
                                  childNodePath: ContentPath): TreeNode<ContentSummaryAndCompareStatus> {
        const children: TreeNode<ContentSummaryAndCompareStatus>[] = node.getChildren();
        for (let i = 0; i < children.length; i++) {
            const childPath: ContentPath = children[i].getData().getPath();

            if (childPath && childPath.equals(childNodePath)) {
                return children[i];
            }
        }

        // scrolling to last child of node to make node load the rest
        const child: TreeNode<ContentSummaryAndCompareStatus> = children[children.length - 1];
        this.scrollToRow(this.getGrid().getDataView().getRowById(child.getId()));

        return null;
    }

    private waitChildrenLoadedAndFindChildNodeByPath(node: TreeNode<ContentSummaryAndCompareStatus>,
                                                     childNodePath: ContentPath): Q.Promise<TreeNode<ContentSummaryAndCompareStatus>> {
        const deferred = Q.defer<TreeNode<ContentSummaryAndCompareStatus>>();

        const dataChangedHandler = () => {
            const childNode: TreeNode<ContentSummaryAndCompareStatus> = this.doFindChildNodeByPath(node, childNodePath);
            if (childNode) {
                this.unDataChanged(dataChangedHandler);
                deferred.resolve(this.doFindChildNodeByPath(node, childNodePath));
            }
        };

        this.onDataChanged(dataChangedHandler);

        dataChangedHandler();

        return deferred.promise;
    }

    private placeContentNode(parent: TreeNode<ContentSummaryAndCompareStatus>,
                             child: TreeNode<ContentSummaryAndCompareStatus>): Q.Promise<TreeNode<ContentSummaryAndCompareStatus>> {
        return this.fetchChildrenIds(parent).then((result: ContentId[]) => {
            const map: string[] = result.map((el) => {
                return el.toString();
            });
            const index: number = map.indexOf(child.getData().getId());

            if (!parent.hasParent() ||
                (child.getData() && parent.hasChildren()) ||
                (child.getData() && !parent.hasChildren() && !child.getData().getContentSummary().hasChildren())) {
                const isParentExpanded: boolean = parent.isExpanded();
                parent.moveChild(child, index);
                parent.setExpanded(isParentExpanded); // in case of a single child it forces its parent to stay expanded
            }

            child.clearViewers();

            return child;
        });
    }

    private placeContentNodes(nodes: TreeNode<ContentSummaryAndCompareStatus>[]): Q.Promise<any> {
        const parallelPromises: Q.Promise<any>[] = [];

        nodes.forEach((node: TreeNode<ContentSummaryAndCompareStatus>) => {
            parallelPromises.push(this.placeContentNode(node.getParent(), node));
        });

        return Q.allSettled(parallelPromises).then((results) => {
            this.reInitData();
            this.invalidate();
            return results;
        });
    }

    private deleteContentNode(node: TreeNode<ContentSummaryAndCompareStatus>): TreeNode<ContentSummaryAndCompareStatus> {
        const parentNode: TreeNode<ContentSummaryAndCompareStatus> = node.getParent();

        if (this.isNodeHighlighted(node)) {
            this.removeHighlighting();
        }

        node.remove();

        const data: ContentSummaryAndCompareStatus = parentNode ? parentNode.getData() : null;
        if (data && !parentNode.hasChildren() && data.getContentSummary().hasChildren()) {
            data.setContentSummary(new ContentSummaryBuilder(data.getContentSummary()).setHasChildren(false).build());
        }

        return parentNode;
    }

    deleteContentNodes(paths: ContentPath[]): TreeNode<ContentSummaryAndCompareStatus>[] {
        const nodes: TreeNode<ContentSummaryAndCompareStatus>[] = this.getNodes(paths);
        this.deselectDeletedNodes(nodes);

        nodes.forEach((node) => {
            this.deleteContentNode(node);
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

    sortNodesChildren(data: ContentSummaryAndCompareStatus[]) {
        const changed: TreeNode<ContentSummaryAndCompareStatus>[] = this.doUpdateContentNodes(data);

        changed.forEach((node: TreeNode<ContentSummaryAndCompareStatus>) => {
            this.sortNodeChildren(node);
        });

        this.invalidateNodes(changed);
    }

    protected handleItemMetadata(row: number) {
        const node: TreeNode<ContentSummaryAndCompareStatus> = this.getItem(row);
        if (this.isEmptyNode(node)) {
            return {cssClasses: 'empty-node'};
        }

        if (node.getData().isReadOnly()) {
            return {cssClasses: `readonly' title='${i18n('field.readOnly')}'`};
        }

        let cssClasses: string = '';

        if (!!node.getData().getContentSummary() && node.getData().getContentSummary().isDataInherited()) {
            cssClasses += 'data-inherited';
        }

        if (!!node.getData().getContentSummary() && node.getData().getContentSummary().isSortInherited()) {
            cssClasses += ' sort-inherited';
        }

        return {cssClasses: cssClasses};
    }

    getSelectedOrHighlightedItems(): ContentSummaryAndCompareStatus[] {
        const selectedItems: ContentSummaryAndCompareStatus[] = this.getFullSelection();

        if (selectedItems.length > 0) {
            return selectedItems;
        }

        if (this.hasHighlightedNode()) {
            return [this.getHighlightedItem()];
        }

        return [];
    }

    renameContentNodes(data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]): Q.Promise<void> {
        this.processRenamedNodes(data, oldPaths);
        return Q(null);
    }

    private getPathsFromData(data: ContentSummaryAndCompareStatus[]): ContentPath[] {
        return data.map(d => d.getPath());
    }

    private processRenamedNodes(data: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) {
        const renamedNodes: TreeNode<ContentSummaryAndCompareStatus>[] = this.getNodes(oldPaths);

        data.forEach((newData: ContentSummaryAndCompareStatus) => {
            this.updatePathsOfRenamedNodes(newData, renamedNodes);
        });

        this.placeContentNodes(renamedNodes);
    }

    private updatePathsOfRenamedNodes(newData: ContentSummaryAndCompareStatus, oldNodes: TreeNode<ContentSummaryAndCompareStatus>[]) {
        oldNodes.forEach((node) => {
            if (node.getDataId() === newData.getId()) {
                node.setData(newData);
                node.clearViewers();
                this.updatePathsInChildren(node);
            }
        });
    }

    addContentNodes(data: ContentSummaryAndCompareStatus[]): Q.Promise<void> {
        return this.processContentCreated(this.getParentsOfCreatedContents(data));
    }

    private getParentsOfCreatedContents(data: ContentSummaryAndCompareStatus[]): TreeNodeParentOfContent[] {
        const createResult: TreeNodesOfContentPath[] = this.findParentsByPaths(this.getPathsFromData(data));
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

    private processContentCreated(nodes: TreeNodeParentOfContent[]): Q.Promise<void> {
        return this.appendContentNodes(nodes).then((results: TreeNode<ContentSummaryAndCompareStatus>[]) => {
            return this.placeContentNodes(this.getNodesThatShouldBeVisible(results)).then(() => {
                this.initAndRender();

                return Q(null);
            });
        });
    }

    private appendContentNodes(relationships: TreeNodeParentOfContent[]): Q.Promise<TreeNode<ContentSummaryAndCompareStatus>[]> {
        const deferred = Q.defer<TreeNode<ContentSummaryAndCompareStatus>[]>();
        const parallelPromises: Q.Promise<TreeNode<ContentSummaryAndCompareStatus>[]>[] = [];
        const result: TreeNode<ContentSummaryAndCompareStatus>[] = [];

        relationships.forEach((relationship) => {
            parallelPromises.push(this.fetchChildrenIds(relationship.getNode()).then((contentIds: ContentId[]) => {
                relationship.getChildren().forEach((content: ContentSummaryAndCompareStatus) => {
                    result.push(this.appendContentNode(relationship.getNode(), content, contentIds.indexOf(content.getContentId()), false));
                });
                return result;
            }));
        });

        Q.all(parallelPromises).then(() => {
            deferred.resolve(result);
        });
        return deferred.promise;
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

    private getNodesThatShouldBeVisible(items: TreeNode<ContentSummaryAndCompareStatus>[]): TreeNode<ContentSummaryAndCompareStatus>[] {
        const nodesThatShouldBeVisible: TreeNode<ContentSummaryAndCompareStatus>[] = [];

        items.forEach((appendedNode) => {
            if (appendedNode.getParent() && appendedNode.getParent().isExpanded()) {
                nodesThatShouldBeVisible.push(appendedNode);
            }
        });

        return nodesThatShouldBeVisible;
    }

    updateContentNodes(data: ContentSummaryAndCompareStatus[]): Q.Promise<TreeNode<ContentSummaryAndCompareStatus>[]> {
        const changed: TreeNode<ContentSummaryAndCompareStatus>[] = this.doUpdateContentNodes(data);
        this.invalidateNodes(changed);

        return Q(changed);
    }

    private doUpdateContentNodes(data: ContentSummaryAndCompareStatus[]): TreeNode<ContentSummaryAndCompareStatus>[] {
        const treeNodes: TreeNodesOfContentPath[] = this.findByPaths(this.getPathsFromData(data));

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
        if (this.hasSelectedOrHighlightedNode() && !this.isGivenPathSelectedInGrid(contentPath)) {
            this.selectNodeByPath(contentPath);
        }
    }

    private isGivenPathSelectedInGrid(path: ContentPath): boolean {
        const item: ContentSummaryAndCompareStatus = this.getFirstSelectedOrHighlightedItem();

        if (item) {
            return item.getPath().equals(path);
        }

        return false;
    }

    getDefaultFullTotal(): number {
        return this.getRoot().getDefaultRoot().treeToList(false, false).length;
    }
}
