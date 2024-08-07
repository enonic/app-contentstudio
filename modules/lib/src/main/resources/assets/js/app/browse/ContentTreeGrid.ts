import * as Q from 'q';
import {ElementHelper} from '@enonic/lib-admin-ui/dom/ElementHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {SortContentEvent} from './sort/SortContentEvent';
import {ContentTreeGridActions} from './action/ContentTreeGridActions';
import {ContentTreeGridToolbar} from './ContentTreeGridToolbar';
import {ContentTreeGridLoadedEvent} from './ContentTreeGridLoadedEvent';
import {ContentQueryRequest} from '../resource/ContentQueryRequest';
import {ContentQueryResult} from '../resource/ContentQueryResult';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {ContentResponse} from '../resource/ContentResponse';
import {ContentRowFormatter} from './ContentRowFormatter';
import {EditContentEvent} from '../event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentQuery} from '../content/ContentQuery';
import {ResultMetadata} from '../resource/ResultMetadata';
import {TreeGrid} from '@enonic/lib-admin-ui/ui/treegrid/TreeGrid';
import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
import {TreeGridBuilder} from '@enonic/lib-admin-ui/ui/treegrid/TreeGridBuilder';
import {DateTimeFormatter} from '@enonic/lib-admin-ui/ui/treegrid/DateTimeFormatter';
import {TreeGridContextMenu} from '@enonic/lib-admin-ui/ui/treegrid/TreeGridContextMenu';
import {Expand} from '@enonic/lib-admin-ui/rest/Expand';
import {UploadItem} from '@enonic/lib-admin-ui/ui/uploader/UploadItem';
import {GridColumnConfig} from '@enonic/lib-admin-ui/ui/grid/GridColumn';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {DeletedContentItem} from './DeletedContentItem';
import {ContentSummary, ContentSummaryBuilder} from '../content/ContentSummary';
import {ChildOrder} from '../resource/order/ChildOrder';
import {ContentId} from '../content/ContentId';
import {ContentSummaryJson} from '../content/ContentSummaryJson';
import {ContentPath} from '../content/ContentPath';
import {ContentTreeGridDeselectAllEvent} from './ContentTreeGridDeselectAllEvent';
import {Branch} from '../versioning/Branch';

export enum State {
    ENABLED, DISABLED
}

export class ContentTreeGrid
    extends TreeGrid<ContentSummaryAndCompareStatus> {

    static MAX_FETCH_SIZE: number = 10;

    private filterQuery: ContentQuery;

    private state: State;

    private contentFetcher: ContentSummaryAndCompareStatusFetcher;

    private doubleClickListeners: (() => void)[] = [];

    private branch: Branch = Branch.DRAFT;

    constructor() {
        const builder: TreeGridBuilder<ContentSummaryAndCompareStatus> =
            new TreeGridBuilder<ContentSummaryAndCompareStatus>()
                .setColumnConfig(ContentTreeGrid.createColumnConfig())
                .setPartialLoadEnabled(true)
                .setLoadBufferSize(20)
                .prependClasses('content-tree-grid');

        super(builder);

        this.contentFetcher = new ContentSummaryAndCompareStatusFetcher();
        this.state = State.ENABLED;
     //   this.setContextMenu(new TreeGridContextMenu(new ContentTreeGridActions(this)));

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
            name: 'Order',
            id: 'order',
            field: 'contentSummary.order',
            formatter: ContentRowFormatter.orderFormatter,
            style: {cssClass: 'order', minWidth: 25, maxWidth: 40}
        }, {
            name: 'CompareStatus',
            id: 'compareStatus',
            field: 'compareStatus',
            formatter: ContentRowFormatter.statusFormatter,
            style: {cssClass: 'status', minWidth: 75, maxWidth: 75}
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

        this.onLoaded(() => {
            new ContentTreeGridLoadedEvent().fire();
        });

        ContentTreeGridDeselectAllEvent.on(() => {
            this.deselectAll();
        });
    }

    private handleGridClick(event: JQuery.EventBase) {
        const elem: ElementHelper = new ElementHelper(event.target);
        if (elem.hasClass('sort-dialog-trigger')) {
            new SortContentEvent(this.getSelectedDataList()).fire();
        }
    }

    private handleGridDoubleClick(event: JQuery.EventBase, data: Slick.OnDblClickEventArgs<ContentSummaryAndCompareStatus>) {
        if (this.isActive() && this.isEditAllowed(event, data)) {
            const node: TreeNode<ContentSummaryAndCompareStatus> = this.getGrid().getDataView().getItem(data.row);
            if (!node.getData().isPendingDelete()) {
                /*
                 * Empty node double-clicked. Additional %MAX_FETCH_SIZE%
                 * nodes will be loaded and displayed. If any other
                 * node is clicked, edit event will be triggered by default.
                 */
                this.editItem(node);
            }
        }

        this.notifyDoubleClick();
    }

    private isEditAllowed(event: JQuery.EventBase, data: Slick.OnDblClickEventArgs<ContentSummaryAndCompareStatus>): boolean {
        if (data?.cell === 0) {
            return false;
        }

        return !event?.target?.classList?.contains('toggle');
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

    setTargetBranch(branch: Branch): void {
        this.branch = branch;
    }

    clean() {
        this.deselectAll();
        this.getGridData().setItems([]);
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
        return this.contentFetcher.fetch(id);
    }

    fetchChildren(parentNode?: TreeNode<ContentSummaryAndCompareStatus>): Q.Promise<ContentSummaryAndCompareStatus[]> {
        if (!parentNode || this.isRootNode(parentNode)) {
            return this.fetchRoot();
        } else {
            return this.doFetchChildren(parentNode);
        }
    }

    setFilterQuery(query: ContentQuery | null): void {
        this.filterQuery = query ? new ContentQuery() : null;

        if (query) {
            this.filterQuery
                .setSize(ContentTreeGrid.MAX_FETCH_SIZE)
                .setQueryFilters(query.getQueryFilters())
                .setQuery(query.getQuery())
                .setQuerySort(query.getQuerySort())
                .setContentTypeNames(query.getContentTypes())
                .setMustBeReferencedById(query.getMustBeReferencedById());

            this.getRoot().setFiltered(true);
            this.reload().catch(DefaultErrorHandler.handle);
        } else {
            this.resetFilter();
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

        return this.contentFetcher.fetchRoot(from, ContentTreeGrid.MAX_FETCH_SIZE).then(
            (data: ContentResponse<ContentSummaryAndCompareStatus>) => {
                return this.processContentResponse(root, data, from);
            });
    }

    private processContentResponse(node: TreeNode<ContentSummaryAndCompareStatus>, data: ContentResponse<ContentSummaryAndCompareStatus>,
                                   from: number): ContentSummaryAndCompareStatus[] {
        const contents: ContentSummaryAndCompareStatus[] = node.getChildren().map((el) => {
            return el.getData();
        }).slice(0, from).concat(data.getContents());

        const meta: ResultMetadata = data.getMetadata();
        node.setMaxChildren(meta.getTotalHits());
        if (this.isEmptyNodeNeeded(meta, from)) {
            contents.push(new ContentSummaryAndCompareStatus());
        }

        return contents;
    }

    private isEmptyNodeNeeded(meta: ResultMetadata, from: number = 0): boolean {
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
        return this.makeContentQueryRequest(from, size).sendAndParse();
    }

    private makeContentQueryRequest(from: number, size: number): ContentQueryRequest<ContentSummaryJson, ContentSummary> {
        this.filterQuery.setFrom(from).setSize(size);

        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(this.filterQuery)
            .setTargetBranch(this.branch)
            .setExpand(Expand.SUMMARY);
    }

    private processContentQueryResponse(node: TreeNode<ContentSummaryAndCompareStatus>,
                                        data: ContentQueryResult<ContentSummary, ContentSummaryJson>,
                                        from: number): Q.Promise<ContentSummaryAndCompareStatus[]> {
        return this.contentFetcher
            .updateReadonlyAndCompareStatus(data.getContents())
            .then((processedContents: ContentSummaryAndCompareStatus[]) => {

                const contents: ContentSummaryAndCompareStatus[] =
                    node.getChildren()
                        .map((el: TreeNode<ContentSummaryAndCompareStatus>) => el.getData())
                        .slice(0, from)
                        .concat(processedContents);

                const meta: ResultMetadata = data.getMetadata();
                if (this.isEmptyNodeNeeded(meta, from)) {
                    contents.push(new ContentSummaryAndCompareStatus());
                }
                node.setMaxChildren(meta.getTotalHits());
                return contents;
            });
    }

    private doFetchChildren(parentNode: TreeNode<ContentSummaryAndCompareStatus>): Q.Promise<ContentSummaryAndCompareStatus[]> {
        this.removeEmptyNode(parentNode);

        return this.fetchChildrenContents(parentNode);
    }

    private fetchChildrenContents(parentNode: TreeNode<ContentSummaryAndCompareStatus>): Q.Promise<ContentSummaryAndCompareStatus[]> {
        const parentContentId: ContentId = parentNode.getData().getContentId();
        const from: number = parentNode.getChildren().length;

        return this.contentFetcher.fetchChildren(parentContentId, from, ContentTreeGrid.MAX_FETCH_SIZE).then(
            (data: ContentResponse<ContentSummaryAndCompareStatus>) => {
                return this.processContentResponse(parentNode, data, from);
            });
    }

    appendUploadNode(item: UploadItem<ContentSummary>) {
        const data: ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatus.fromUploadItem(item);
        const parent: TreeNode<ContentSummaryAndCompareStatus> =
            this.getFirstSelectedOrHighlightedNode() || this.getRoot().getDefaultRoot();

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
        uploadItem.onProgress(() => {
            this.invalidateNodes([uploadNode]);
        });
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
        }).catch((reason) => {
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
        for (const child of children) {
            const childPath: ContentPath = child.getData().getPath();

            if (childPath && childPath.equals(childNodePath)) {
                return child;
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
            const path: ContentPath = ContentPath.create().fromParent(nodeSummary.getPath(), childSummary.getPath().getName()).build();
            const newData: ContentSummaryAndCompareStatus = child.getData();
            newData.setContentSummary(new ContentSummaryBuilder(childSummary).setPath(path).build());
            this.doUpdateNodeByData(child, newData);
            this.updatePathsInChildren(child);
        }
    }

    updateNodes(data: ContentSummaryAndCompareStatus[]): void {
        // when items sorting was changed from manual to inherited manual we have to trigger sort ourselves since no sort event coming
        const isSortingChangedToManualInheritance: ContentSummaryAndCompareStatus = data.find(
            (item: ContentSummaryAndCompareStatus) => this.isSortingChangedToManualInheritance(item));

        if (isSortingChangedToManualInheritance) {
            this.sortNodesChildren([isSortingChangedToManualInheritance]);
        } else {
            this.updateNodesByData(data);
        }
    }

    private isSortingChangedToManualInheritance(item: ContentSummaryAndCompareStatus): boolean {
        if (!item.getContentSummary()?.getChildOrder().isManual()) {
            return false;
        }

        if (!item.isSortInherited()) {
            return false;
        }

        const node: TreeNode<ContentSummaryAndCompareStatus> = this.getRoot().getNodeByDataIdFromCurrent(item.getId());

        return node && !node.getData().isSortInherited();
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

        if (node.getData().getContentSummary()?.isDataInherited()) {
            cssClasses += 'data-inherited';
        }

        if (node.getData().getContentSummary()?.isSortInherited()) {
            cssClasses += ' sort-inherited';
        }

        if (node.getData().isReadOnly()) {
            cssClasses += ' readonly';
        }

        return {cssClasses: cssClasses.trim()};
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
        if (this.isFiltered()) {
            this.addContentItemsTo(itemsToAdd, true);
        }

        this.addContentItemsTo(itemsToAdd, false);
    }

    private addContentItemsTo(itemsToAdd: ContentSummaryAndCompareStatus[], isInFiltered: boolean): void {
        const parentsOfChildrenToAdd: Map<TreeNode<ContentSummaryAndCompareStatus>, ContentSummaryAndCompareStatus[]> =
            this.getParentsOfItemsToAdd(itemsToAdd, isInFiltered);

        parentsOfChildrenToAdd.forEach((items: ContentSummaryAndCompareStatus[], parentNode: TreeNode<ContentSummaryAndCompareStatus>) => {
            this.addItemsToParent(items, parentNode, isInFiltered);
        });
    }

    private addItemsToParent(items: ContentSummaryAndCompareStatus[], parentNode: TreeNode<ContentSummaryAndCompareStatus>,
                             isInFiltered: boolean): void {
        if (parentNode.isExpandable() && !parentNode.hasChildren()) {
            return;
        }

        if (!parentNode.isExpandable() && parentNode.hasData()) {
            this.updateNodeHasChildren(parentNode, true);
            return;
        }

        const parentId: ContentId = parentNode.hasData() ? parentNode.getData().getContentId() : null;

        this.fetchChildrenIds(parentId).then((childrenIds: ContentId[]) => {
            items.forEach((item: ContentSummaryAndCompareStatus) => {
                const contentId: ContentId = item.getContentId();
                const insertPosition: number = childrenIds.findIndex((childId: ContentId) => contentId.equals(childId));

                if (insertPosition > -1 && insertPosition <= parentNode.getChildren().length) {
                    if (isInFiltered || !this.isFiltered()) {
                        this.insertDataToParentNode(item, parentNode, insertPosition);
                    } else {
                        // if this grid is filtered, and we need to insert an item into the non-filtered root node, then
                        // "insertDataToParentNode" will add an item immediately to the current (filtered) root, thus need to:
                        const nodeToInsert = this.dataToTreeNode(item, parentNode);
                        parentNode.insertChild(nodeToInsert, insertPosition);
                        parentNode.setExpandable(true);
                    }
                }
            });
        });
    }

    private fetchChildrenIds(parentId: ContentId): Q.Promise<ContentId[]> {
        if (this.isFiltered() && !parentId) { // need to perform query and return root children ids
            return this.makeContentQueryRequest(0, -1).setExpand(Expand.NONE).sendAndParse().then(
                (result: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                    return result.getContents().map((item) => item as unknown as ContentId);
                });
        }

        const order: ChildOrder = !!parentId ? null : this.contentFetcher.createRootChildOrder();

        return this.contentFetcher.fetchChildrenIds(parentId, order);
    }

    private getParentsOfItemsToAdd(itemsToAdd: ContentSummaryAndCompareStatus[], isInFiltered: boolean):
        Map<TreeNode<ContentSummaryAndCompareStatus>, ContentSummaryAndCompareStatus[]> {
        const parentsOfChildrenToAdd: Map<TreeNode<ContentSummaryAndCompareStatus>, ContentSummaryAndCompareStatus[]> =
            new Map<TreeNode<ContentSummaryAndCompareStatus>, ContentSummaryAndCompareStatus[]>();
        const allNodes: TreeNode<ContentSummaryAndCompareStatus>[] = isInFiltered
                                                                     ? this.getRoot().getAllFilteredRootNodes()
                                                                     : this.getRoot().getAllDefaultRootNodes();


        itemsToAdd
            .filter((item: ContentSummaryAndCompareStatus) => !this.hasItemWithDataId(item.getId()))
            .forEach((itemToAdd: ContentSummaryAndCompareStatus) => {
                const parentPathOfItemToAdd: ContentPath = itemToAdd.getPath().getParentPath();
                const parentNode: TreeNode<ContentSummaryAndCompareStatus> = this.getParentNodeByPath(parentPathOfItemToAdd, allNodes,
                    isInFiltered);

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
                                nodes: TreeNode<ContentSummaryAndCompareStatus>[],
                                isInFiltered: boolean): TreeNode<ContentSummaryAndCompareStatus> {
        if (parentPath.isRoot()) {
            return isInFiltered ? this.getRoot().getFilteredRoot() : this.getRoot().getDefaultRoot();
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

    getRootItemsIds(): string[] {
        return this.getRoot().getDefaultRoot().getChildren().map((item: TreeNode<ContentSummaryAndCompareStatus>) => item.getDataId());
    }

    deleteItems(items: DeletedContentItem[]): void {
        if (this.isFiltered()) {
            this.deleteItemsInFilteredRoot(items);
        }

        this.deleteItemsInDefaultRoot(items);
    }

    private deleteItemsInDefaultRoot(items: DeletedContentItem[]): void {
        this.doDeleteItems(items, this.getRoot().getAllDefaultRootNodes(), false);
    }

    private deleteItemsInFilteredRoot(items: DeletedContentItem[]): void {
        this.doDeleteItems(items, this.getRoot().getAllFilteredRootNodes(), true);
    }

    private doDeleteItems(items: DeletedContentItem[], allNodes: TreeNode<ContentSummaryAndCompareStatus>[], isInFiltered: boolean): void {
        const nodesToDelete: TreeNode<ContentSummaryAndCompareStatus>[] = [];

        items.forEach((item: DeletedContentItem) => {
            const nodesForItem: TreeNode<ContentSummaryAndCompareStatus>[] = this.findNodeByItem(item, allNodes);

            if (nodesForItem?.length > 0) {
                nodesToDelete.push(...nodesForItem);
            }

            this.updateParentHasChildren(item, allNodes, isInFiltered);
        });

        if (nodesToDelete.length > 0) {
            this.deleteNodes(nodesToDelete);
        }
    }

    private updateParentHasChildren(item: DeletedContentItem, allNodes: TreeNode<ContentSummaryAndCompareStatus>[],
                                    isInFiltered: boolean): void {
        const parentPath: ContentPath = item.path.getParentPath();

        if (parentPath && !parentPath.isRoot()) {
            const parentNode: TreeNode<ContentSummaryAndCompareStatus> = this.getParentNodeByPath(parentPath, allNodes, isInFiltered);

            if (parentNode && !parentNode.hasChildren()) {
                this.contentFetcher.fetchChildrenIds(parentNode.getData().getContentId()).then((ids: ContentId[]) => {
                    if (ids.length === 0) {
                        this.updateNodeHasChildren(parentNode, false);
                    }
                }).catch(DefaultErrorHandler.handle).done();
            }
        }
    }

    private findNodeByItem(item: DeletedContentItem,
                           allNodes: TreeNode<ContentSummaryAndCompareStatus>[]): TreeNode<ContentSummaryAndCompareStatus>[] {
        return allNodes.filter((node: TreeNode<ContentSummaryAndCompareStatus>) => {
            return node.getData()?.getPath()?.equals(item.path) || node.getData()?.getContentId()?.equals(item.id);
        });
    }

    resizeCanvas(): void {
        this.getGrid().resizeCanvas();
    }

    getHighlightedItem(): ContentSummaryAndCompareStatus {
        // returning highlighted item from current root, super version returns from default root even when grid is filtered
        return this.getHighlightedNode()?.getData() || super.getHighlightedItem();
    }

    updateItemIsRenderable(id: string, isRenderable: boolean): void {
        if (this.isFiltered()) {
            this.getRoot().getNodeByDataIdFromFiltered(id)?.getData().setRenderable(isRenderable);
        }

        this.getRoot().getNodeByDataIdFromDefault(id)?.getData().setRenderable(isRenderable);
    }

    onDoubleClick(listener: () => void) {
        this.doubleClickListeners.push(listener);
    }

    unDoubleClick(listener: () => void) {
        this.doubleClickListeners = this.doubleClickListeners.filter((current) => (current !== listener));
    }

    private notifyDoubleClick() {
        this.doubleClickListeners.forEach((listener: () => void) => listener());
    }

    copyStatusFromExistingNodes(data: ContentSummaryAndCompareStatus[]) {
        data.forEach((newItem: ContentSummaryAndCompareStatus) => {
            const existingItem: ContentSummaryAndCompareStatus = this.getRoot().getNodeByDataIdFromCurrent(newItem.getId())?.getData();
            if (existingItem) {
                newItem.setCompareStatus(existingItem.getCompareStatus());
            }
        });
    }

    copyPermissionsFromExistingNodes(data: ContentSummaryAndCompareStatus[]) {
        data.forEach((newItem: ContentSummaryAndCompareStatus) => {
            const existingItem: ContentSummaryAndCompareStatus = this.getRoot().getNodeByDataIdFromCurrent(newItem.getId())?.getData();
            if (existingItem) {
                newItem.setReadOnly(existingItem.isReadOnly());
            }
        });
    }
}
