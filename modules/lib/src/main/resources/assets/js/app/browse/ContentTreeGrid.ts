import * as Q from 'q';
import {ElementHelper} from 'lib-admin-ui/dom/ElementHelper';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Body} from 'lib-admin-ui/dom/Body';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {SortContentEvent} from './sort/SortContentEvent';
import {ContentTreeGridActions} from './action/ContentTreeGridActions';
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
import {DeletedContentItem} from './DeletedContentItem';
import {ChildOrder} from 'lib-admin-ui/content/order/ChildOrder';
import {ContentSummary, ContentSummaryBuilder} from '../content/ContentSummary';

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
        if (node.getDataId()) { // default event
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
        if (this.isActive() && this.isEditAllowed(event, data)) {
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

    private isEditAllowed(event: any, data: any): boolean {
        if (data?.cell === 0) {
            return false;
        }

        if (event?.target?.classList?.contains('toggle')) {
            return false;
        }

        return true;
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
            this.updateNodeByData(ContentSummaryAndCompareStatus.fromContentSummary(content.getContentSummary()));
        }
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

    reload(): Q.Promise<void> {
        if (this.state === State.DISABLED) {
            return Q(null);
        }

        return super.reload();
    }

    isEmptyNode(node: TreeNode<ContentSummaryAndCompareStatus>): boolean {
        const data = node.getData();
        return !data.getContentSummary() && !data.getUploadItem();
    }

    hasChildren(data: ContentSummaryAndCompareStatus): boolean {
        return data.hasChildren();
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

    appendUploadNode(item: UploadItem<ContentSummary>) {
        const data: ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatus.fromUploadItem(item);
        const parent: TreeNode<ContentSummaryAndCompareStatus> = this.getFirstSelectedOrHighlightedNode();

        if (!parent) {
            return;
        }

        if (!parent.isExpandable() || parent.hasChildren()) {
            const uploadNode: TreeNode<ContentSummaryAndCompareStatus> = this.dataToTreeNode(data, parent);
            this.insertNodeToParentNode(uploadNode, parent, 0);
            if (!parent.isExpanded()) {
                this.expandNode(parent);
            }
            this.addUploadItemListeners(uploadNode, data);
        }
    }

    private addUploadItemListeners(uploadNode: TreeNode<ContentSummaryAndCompareStatus>, data: ContentSummaryAndCompareStatus) {
        const uploadItem: UploadItem<ContentSummary> = uploadNode.getData().getUploadItem();
        uploadItem.onProgress(this.invalidate.bind(this));
        uploadItem.onUploaded(() => {
            this.deleteNode(uploadNode);
            showFeedback(i18n('notify.item.created', data.getContentSummary().getType().toString(), uploadItem.getName()));
        });
        uploadItem.onFailed(() => {
            this.deleteNode(uploadNode);
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

    private updatePathsInChildren(parentNode: TreeNode<ContentSummaryAndCompareStatus>) {
        parentNode.getChildren().forEach((child: TreeNode<ContentSummaryAndCompareStatus>) => {
            this.updatePathInChild(parentNode, child);
        });
    }

    private updatePathInChild(parentNode: TreeNode<ContentSummaryAndCompareStatus>, child: TreeNode<ContentSummaryAndCompareStatus>) {
        const nodeSummary: ContentSummary = parentNode.getData() ? parentNode.getData().getContentSummary() : null;
        const childSummary: ContentSummary = child.getData() ? child.getData().getContentSummary() : null;

        if (nodeSummary && childSummary) {
            const path: ContentPath = ContentPath.fromParent(nodeSummary.getPath(), childSummary.getPath().getName());
            const newData: ContentSummaryAndCompareStatus = child.getData();
            newData.setContentSummary(new ContentSummaryBuilder(childSummary).setPath(path).build());
            this.doUpdateNodeByData(child, newData);
            this.updatePathsInChildren(child);
        }
    }

    sortNodesChildren(data: ContentSummaryAndCompareStatus[]) {
        this.updateNodesByData(data);

        const changed: TreeNode<ContentSummaryAndCompareStatus>[] = [];
        data.forEach((item: ContentSummaryAndCompareStatus) => {
            const node: TreeNode<ContentSummaryAndCompareStatus> = this.getRoot().getNodeByDataIdFromCurrent(item.getId());
            if (node) {
                changed.push(node);
            }
        });

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

        let cssClasses: string = '';

        if (!!node.getData().getContentSummary() && node.getData().getContentSummary().isDataInherited()) {
            cssClasses += 'data-inherited';
        }

        if (!!node.getData().getContentSummary() && node.getData().getContentSummary().isSortInherited()) {
            cssClasses += ' sort-inherited';
        }

        if (node.getData().isReadOnly()) {
            cssClasses += `readonly' title='${i18n('field.readOnly')}'`;
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

    renameContentNodes(renamedItems: ContentSummaryAndCompareStatus[]) {
        this.updateNodesByData(renamedItems);

        renamedItems.forEach((renamedItem: ContentSummaryAndCompareStatus) => {
            this.getRoot().getNodesByDataId(renamedItem.getId()).forEach(this.updatePathsInChildren.bind(this));
        });
    }


    addContentNodes(itemsToAdd: ContentSummaryAndCompareStatus[]) {
        const parentsOfChildrenToAdd: Map<TreeNode<ContentSummaryAndCompareStatus>, ContentSummaryAndCompareStatus[]> =
            this.getParentsOfItemsToAdd(itemsToAdd);

        parentsOfChildrenToAdd.forEach((items: ContentSummaryAndCompareStatus[], parentNode: TreeNode<ContentSummaryAndCompareStatus>) => {
            this.addItemsToParent(items, parentNode);
        });
    }

    private addItemsToParent(items: ContentSummaryAndCompareStatus[], parentNode: TreeNode<ContentSummaryAndCompareStatus>) {
        if (parentNode.isExpandable() && !parentNode.hasChildren()) {
            return;
        }

        if (!parentNode.isExpandable() && parentNode.hasData()) {
            this.updateNodeHasChildren(parentNode, true);
            return;
        }

        const parentId: ContentId = parentNode.hasData() ? parentNode.getData().getContentId() : null;
        const order: ChildOrder = !!parentId ? null : ContentSummaryAndCompareStatusFetcher.createRootChildOrder();
        ContentSummaryAndCompareStatusFetcher.fetchChildrenIds(parentId, order)
            .then((childrenIds: ContentId[]) => {
                items.forEach((item: ContentSummaryAndCompareStatus) => {
                    const contentId: ContentId = item.getContentId();
                    let insertPosition: number = -1;

                    childrenIds.some((childId: ContentId, index: number) => {
                        if (contentId.equals(childId)) {
                            insertPosition = index;
                            return true;
                        }

                        return false;
                    });

                    if (insertPosition > -1) {
                        this.insertDataToParentNode(item, parentNode, insertPosition);
                    }
                });
            });
    }

    private getParentsOfItemsToAdd(itemsToAdd: ContentSummaryAndCompareStatus[]):
        Map<TreeNode<ContentSummaryAndCompareStatus>, ContentSummaryAndCompareStatus[]> {
        const parentsOfChildrenToAdd: Map<TreeNode<ContentSummaryAndCompareStatus>, ContentSummaryAndCompareStatus[]> =
            new Map<TreeNode<ContentSummaryAndCompareStatus>, ContentSummaryAndCompareStatus[]>();
        const allNodes: TreeNode<ContentSummaryAndCompareStatus>[] = this.getRoot().getAllDefaultRootNodes();


        itemsToAdd.forEach((itemToAdd: ContentSummaryAndCompareStatus) => {
            const parentPathOfItemToAdd: ContentPath = itemToAdd.getPath().getParentPath();
            const parentNode: TreeNode<ContentSummaryAndCompareStatus> = this.getParentNodeByPath(parentPathOfItemToAdd, allNodes);

            if (parentNode) {
                if (parentsOfChildrenToAdd.has(parentNode)) {
                    parentsOfChildrenToAdd.get(parentNode).push(itemToAdd);
                } else {
                    parentsOfChildrenToAdd.set(parentNode, [itemToAdd]);
                }
            }
        });

        return parentsOfChildrenToAdd;
    }

    private getParentNodeByPath(parentPath: ContentPath,
                                nodes: TreeNode<ContentSummaryAndCompareStatus>[]): TreeNode<ContentSummaryAndCompareStatus> {
        if (parentPath.isRoot()) {
            return this.getRoot().getDefaultRoot();
        }

        return nodes.find((node: TreeNode<ContentSummaryAndCompareStatus>) => {
            return parentPath.equals(node.getData().getPath());
        });
    }

    private updateNodeHasChildren(node: TreeNode<ContentSummaryAndCompareStatus>, hasChildren: boolean) {
        node.setExpandable(hasChildren);
        const oldData: ContentSummaryAndCompareStatus = node.getData();
        const newContentSummary: ContentSummary = new ContentSummaryBuilder(oldData.getContentSummary()).setHasChildren(
            hasChildren).build();
        const newData: ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(
            newContentSummary, oldData.getCompareStatus(), oldData.getPublishStatus());
        this.doUpdateNodeByData(node, newData);
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

    deleteItems(items: DeletedContentItem[]) {
        const allNodes: TreeNode<ContentSummaryAndCompareStatus>[] = this.getRoot().getAllDefaultRootNodes();

        items.forEach((item: DeletedContentItem) => {
            if (this.hasItemWithDataId(item.id.toString())) {
                this.deleteNodeByDataId(item.id.toString());
            }

            const parentPath: ContentPath = item.path.getParentPath();

            if (parentPath && !parentPath.isRoot()) {
                const parentNode: TreeNode<ContentSummaryAndCompareStatus> = this.getParentNodeByPath(parentPath, allNodes);

                if (parentNode && !parentNode.hasChildren()) {
                    ContentSummaryAndCompareStatusFetcher.fetchChildrenIds(parentNode.getData().getContentId()).then(
                        (ids: ContentId[]) => {
                            if (ids.length === 0) {
                                this.updateNodeHasChildren(parentNode, false);
                            }
                        }).catch(DefaultErrorHandler.handle).done();
                }
            }
        });
    }
}
