import * as Q from 'q';
import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from 'lib-admin-ui/ui/responsive/ResponsiveItem';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary, ContentSummaryBuilder} from 'lib-admin-ui/content/ContentSummary';
import {TreeGrid} from 'lib-admin-ui/ui/treegrid/TreeGrid';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {TreeGridBuilder} from 'lib-admin-ui/ui/treegrid/TreeGridBuilder';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentSummaryViewer} from 'lib-admin-ui/content/ContentSummaryViewer';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {ContentQueryRequest} from '../resource/ContentQueryRequest';
import {ContentQueryResult} from '../resource/ContentQueryResult';
import {GetContentByIdRequest} from '../resource/GetContentByIdRequest';
import {ListContentByIdRequest} from '../resource/ListContentByIdRequest';
import {ContentResponse} from '../resource/ContentResponse';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {Content} from '../content/Content';
import {ContentQuery} from '../content/ContentQuery';
import {Expand} from 'lib-admin-ui/rest/Expand';

export class ContentDropdownTreeGrid extends TreeGrid<ContentSummary> {

    static MAX_FETCH_SIZE: number = 10;

    private filterQuery: ContentQuery;

    constructor() {
        let builder: TreeGridBuilder<ContentSummary> =
            new TreeGridBuilder<ContentSummary>().setColumnConfig([{
                name: 'Name',
                id: 'displayName',
                field: 'displayName',
                formatter: ContentDropdownTreeGrid.nameFormatter,
                style: {minWidth: 130}
            }]).setPartialLoadEnabled(true).setLoadBufferSize(20).// rows count
            prependClasses('content-tree-grid');

        super(builder);

        let columns = builder.getColumns();
        const nameColumn = columns[1];

        let updateColumns = (force?: boolean) => {
            if (force) {
                this.getGrid().setColumns([nameColumn]);
            } else {
                this.getGrid().resizeCanvas();
            }
        };

        this.initEventHandlers(updateColumns);
    }

    private static nameFormatter(row: number, cell: number, value: any, columnDef: any, node: TreeNode<ContentSummary>) {
        const data = node.getData();
        if (data) {
            let viewer: ContentSummaryViewer = <ContentSummaryViewer> node.getViewer('name');
            if (!viewer) {
                viewer = new ContentSummaryViewer();
                node.setViewer('name', viewer);
            }
            viewer.setIsRelativePath(node.calcLevel() > 1);
            viewer.setObject(node.getData());
            return viewer ? viewer.toString() : '';
        }

        return '';
    }

    private initEventHandlers(updateColumnsHandler: Function) {
        let onBecameActive = (active: boolean) => {
            if (active) {
                updateColumnsHandler(true);
                this.unActiveChanged(onBecameActive);
            }
        };
        // update columns when grid becomes active for the first time
        this.onActiveChanged(onBecameActive);

        ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => {
            if (this.isInRenderingView()) {
                updateColumnsHandler(item.isRangeSizeChanged());
            }
        });
    }

    isEmptyNode(node: TreeNode<ContentSummary>): boolean {
        return !node.getDataId() || node.getDataId() === '';
    }

    hasChildren(data: ContentSummary): boolean {
        return data.hasChildren();
    }

    getDataId(data: ContentSummary): string {
        return data.getId();
    }

    fetch(node: TreeNode<ContentSummary>, dataId?: string): Q.Promise<ContentSummary> {
        return this.fetchById(node.getData().getContentId());
    }

    private fetchById(id: ContentId): Q.Promise<ContentSummary> {
        return new GetContentByIdRequest(id).sendAndParse();
    }

    fetchChildren(parentNode?: TreeNode<ContentSummary>): Q.Promise<ContentSummary[]> {
        let parentContentId: ContentId = null;
        if (parentNode) {
            parentContentId = parentNode.getData() ? parentNode.getData().getContentId() : parentContentId;
        } else {
            parentNode = this.getRoot().getCurrentRoot();
        }
        let from = parentNode.getChildren().length;
        if (from > 0 && !parentNode.getChildren()[from - 1].getData()) {
            parentNode.getChildren().pop();
            from -= 1;
        }

        if (!this.isFiltered() || parentNode !== this.getRoot().getCurrentRoot()) {
            return new ListContentByIdRequest(parentContentId).setFrom(from).setSize(
                ContentDropdownTreeGrid.MAX_FETCH_SIZE).sendAndParse().then(
                (data: ContentResponse<ContentSummary>) => {
                    // TODO: Will reset the ids and the selection for child nodes.
                    let contents = parentNode.getChildren().map((el) => {
                        return el.getData();
                    }).slice(0, from).concat(data.getContents());
                    let meta = data.getMetadata();
                    parentNode.setMaxChildren(meta.getTotalHits());
                    if (from + meta.getHits() < meta.getTotalHits()) {
                        contents.push(new ContentSummaryBuilder().build());
                    }
                    return contents;
                });
        } else {
            this.filterQuery.setFrom(from);
            this.filterQuery.setSize(ContentDropdownTreeGrid.MAX_FETCH_SIZE);
            return new ContentQueryRequest<ContentSummaryJson,ContentSummary>(this.filterQuery).setExpand(
                Expand.SUMMARY).sendAndParse().then(
                (contentQueryResult: ContentQueryResult<ContentSummary,ContentSummaryJson>) => {
                    return contentQueryResult.getContents();
                });
        }
    }

    fetchChildrenIds(parentNode?: TreeNode<ContentSummary>): Q.Promise<ContentId[]> {
        let parentContentId: ContentId = null;
        if (parentNode) {
            parentContentId = parentNode.getData() ? parentNode.getData().getContentId() : parentContentId;
        } else {
            parentNode = this.getRoot().getCurrentRoot();
        }
        let size = parentNode.getChildren().length;
        if (size > 0 && !parentNode.getChildren()[size - 1].getData()) {
            parentNode.getChildren().pop();
            size -= 1;
        }

        if (!this.isFiltered() || parentNode !== this.getRoot().getCurrentRoot()) {
            return ContentSummaryAndCompareStatusFetcher.fetchChildrenIds(parentContentId).then(
                (response: ContentId[]) => {
                    return response;
                });
        } else {
            this.filterQuery.setFrom(0);
            this.filterQuery.setSize(size + 1);
            return new ContentQueryRequest<ContentSummaryJson,ContentSummary>(this.filterQuery).setExpand(
                Expand.SUMMARY).sendAndParse().then(
                (contentQueryResult: ContentQueryResult<ContentSummary,ContentSummaryJson>) => {
                    return contentQueryResult.getContents().map((content => content.getContentId()));
                });
        }
    }

    refreshNodeData(parentNode: TreeNode<ContentSummary>): Q.Promise<TreeNode<ContentSummary>> {
        return new GetContentByIdRequest(parentNode.getData().getContentId()).sendAndParse().then((content: Content)=> {
            parentNode.setData(content);
            this.refreshNode(parentNode);
            return parentNode;
        });
    }

    sortNodeChildren(node: TreeNode<ContentSummary>) {
        let rootNode = this.getRoot().getCurrentRoot();
        if (node !== rootNode) {
            if (node.hasChildren()) {
                node.setChildren([]);
                node.setMaxChildren(0);

                this.fetchChildren(node)
                    .then((dataList: ContentSummary[]) => {
                        let parentNode = this.getRoot().getCurrentRoot().findNode(node.getDataId());
                        parentNode.setChildren(this.dataToTreeNodes(dataList, parentNode));
                        let rootList = this.getRoot().getCurrentRoot().treeToList();
                        this.initData(rootList);
                    }).catch((reason: any) => {
                    DefaultErrorHandler.handle(reason);
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

    /*findByPaths(paths: ContentPath[], useParent: boolean = false): TreeNodesOfContentPath[] {
     let root = this.getRoot().getDefaultRoot().treeToList(false, false);
     let filter = this.getRoot().getFilteredRoot().treeToList(false, false);
     let all: TreeNode<ContentSummary>[] = root.concat(filter);
     let result: TreeNodesOfContentPath[] = [];
     let resultIds: string[] = [];

     for (let i = 0; i < paths.length; i++) {
     let node = useParent
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
     }*/

    selectNodeByPath(targetPath: ContentPath) {
        let currentSelectedNode: TreeNode<ContentSummary> = this.getSelectedNodes()[0];
        let nodeToSearchTargetIn: TreeNode<ContentSummary>;

        if (currentSelectedNode && targetPath.isDescendantOf(currentSelectedNode.getData().getPath())) {
            nodeToSearchTargetIn = currentSelectedNode;
        } else {
            nodeToSearchTargetIn = this.getRoot().getCurrentRoot();
        }

        // go down and expand path's parents level by level until we reach the desired element within the list of fetched children
        this.doSelectNodeByPath(nodeToSearchTargetIn, targetPath);
    }

    private doSelectNodeByPath(nodeToSearchTargetIn: TreeNode<ContentSummary>, targetPath: ContentPath) {
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

    private isTargetNodeLevelReached(nodeToSearchTargetIn: TreeNode<ContentSummary>, targetPath: ContentPath): boolean {
        let nodeToExpandLevel = !!nodeToSearchTargetIn.getData() ? nodeToSearchTargetIn.getData().getPath().getLevel() : 0;
        let targetNodeLevelReached = (targetPath.getLevel() - 1) === nodeToExpandLevel;

        return targetNodeLevelReached;
    }

    private findChildNodeByPath(node: TreeNode<ContentSummary>,
                                childNodePath: ContentPath): Q.Promise<TreeNode<ContentSummary>> {
        let childNode = this.doFindChildNodeByPath(node, childNodePath);

        if (childNode) {
            return Q.resolve(childNode);
        }

        return this.waitChildrenLoadedAndFindChildNodeByPath(node, childNodePath);
    }

    private doFindChildNodeByPath(node: TreeNode<ContentSummary>,
                                  childNodePath: ContentPath): TreeNode<ContentSummary> {
        const children = node.getChildren();
        for (let i = 0; i < children.length; i++) {
            const childPath = children[i].getData().getPath();

            if (childPath && childPath.equals(childNodePath)) {
                return children[i];
            }
        }

        // scrolling to last child of node to make node load the rest
        let child: TreeNode<ContentSummary> = children[children.length - 1];
        this.scrollToRow(this.getGrid().getDataView().getRowById(child.getId()));

        return null;
    }

    private waitChildrenLoadedAndFindChildNodeByPath(node: TreeNode<ContentSummary>,
                                                     childNodePath: ContentPath): Q.Promise<TreeNode<ContentSummary>> {
        let deferred = Q.defer<TreeNode<ContentSummary>>();

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

    updateContentNode(contentId: ContentId) {
        let root = this.getRoot().getCurrentRoot();
        let treeNode = root.findNode(contentId.toString());
        if (treeNode) {
            let content = treeNode.getData();
            this.updateNode(new ContentSummaryBuilder(content).build());
        }
    }

    appendContentNode(parentNode: TreeNode<ContentSummary>, childData: ContentSummary, index: number,
                      update: boolean = true): TreeNode<ContentSummary> {

        let appendedNode = this.dataToTreeNode(childData, parentNode);
        let data = parentNode.getData();

        if (!parentNode.hasParent() ||
            (data && parentNode.hasChildren()) ||
            (data && !parentNode.hasChildren() && !data.hasChildren())) {
            parentNode.insertChild(appendedNode, index);
        }

        if (data && !data.hasChildren()) {
            parentNode.setData(new ContentSummaryBuilder(data).setHasChildren(true).build());
        }

        parentNode.clearViewers();

        if (update) {
            this.initAndRender();
        }

        return appendedNode;

    }

    /*appendContentNodes(relationships: TreeNodeParentOfContent[]): Q.Promise<TreeNode<ContentSummary>[]> {

     let deferred = Q.defer<TreeNode<ContentSummary>[]>();
     let parallelPromises: Q.Promise<TreeNode<ContentSummary>[]>[] = [];
     let result: TreeNode<ContentSummary>[] = [];

     relationships.forEach((relationship) => {
     parallelPromises.push(this.fetchChildrenIds(relationship.getNode()).then((contentIds: ContentId[]) => {
     relationship.getChildren().forEach((content: ContentSummary) => {
     result.push(this.appendContentNode(relationship.getNode(), content, contentIds.indexOf(content.getContentId()), false));
     });
     return result;
     }));
     });

     Q.all(parallelPromises).then(() => {
     deferred.resolve(result);
     });
     return deferred.promise;
     }*/

    placeContentNode(parent: TreeNode<ContentSummary>,
                     child: TreeNode<ContentSummary>): Q.Promise<TreeNode<ContentSummary>> {
        return this.fetchChildrenIds(parent).then((result: ContentId[]) => {
            let map = result.map((el) => {
                return el.toString();
            });
            let index = map.indexOf(child.getData().getId());

            if (!parent.hasParent() ||
                (child.getData() && parent.hasChildren()) ||
                (child.getData() && !parent.hasChildren() && !child.getData().hasChildren())) {
                let parentExpanded = parent.isExpanded();
                parent.moveChild(child, index);
                parent.setExpanded(parentExpanded); // in case of a single child it forces its parent to stay expanded
            }

            child.clearViewers();

            return child;

        });
    }

    placeContentNodes(nodes: TreeNode<ContentSummary>[]): Q.Promise<any> {
        let parallelPromises: Q.Promise<any>[] = [];

        nodes.forEach((node: TreeNode<ContentSummary>) => {
            parallelPromises.push(this.placeContentNode(node.getParent(), node));
        });

        return Q.allSettled(parallelPromises).then((results) => {
            let rootList = this.getRoot().getCurrentRoot().treeToList();
            this.initData(rootList);
            this.invalidate();
            return results;
        });
    }

    deleteContentNode(node: TreeNode<ContentSummary>,
                      update: boolean = true): TreeNode<ContentSummary> {
        let parentNode = node.getParent();

        node.remove();

        let data = parentNode ? parentNode.getData() : null;
        if (data && !parentNode.hasChildren() && data.hasChildren()) {
            parentNode.setData(new ContentSummaryBuilder(data).setHasChildren(false).build());
        }

        if (update) {
            this.initAndRender();
        }

        return parentNode;
    }

    deleteContentNodes(nodes: TreeNode<ContentSummary>[],
                       update: boolean = true) {

        this.deselectDeletedNodes(nodes);

        nodes.forEach((node) => {
            this.deleteContentNode(node, false);
        });

        if (update) {
            this.initAndRender();
        }
    }

    private deselectDeletedNodes(nodes: TreeNode<ContentSummary>[]) {
        let deselected = [];
        this.getSelectedDataList().forEach((content: ContentSummary) => {

            let wasDeleted = nodes.some((node: TreeNode<ContentSummary>) => {
                return content.getContentId().equals(node.getData().getContentId()) ||
                       content.getPath().isDescendantOf(node.getData().getPath());
            });

            if (wasDeleted) {
                deselected.push(content.getId());
            }

        });
        this.deselectNodes(deselected);
    }

    updatePathsInChildren(node: TreeNode<ContentSummary>) {
        node.getChildren().forEach((child) => {
            let nodeSummary = node.getData() ? node.getData() : null;
            let childSummary = child.getData() ? child.getData() : null;
            if (nodeSummary && childSummary) {
                let path = ContentPath.fromParent(nodeSummary.getPath(), childSummary.getPath().getName());
                child.setData(new ContentSummaryBuilder(childSummary).setPath(path).build());
                child.clearViewers();
                this.updatePathsInChildren(child);
            }
        });
    }

    sortNodesChildren(nodes: TreeNode<ContentSummary>[]): Q.Promise<void> {

        let parallelPromises: Q.Promise<any>[] = [];

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

        groups.forEach((grp: TreeNode<ContentSummary>[]) => {
            if (grp.length > 0) {
                parallelPromises.push(
                    this.updateNodes(grp[0].getData()).then(() => {
                        let hasChildren = grp[0].hasChildren();
                        grp[0].setChildren([]);
                        return this.fetchChildren(grp[0]).then((dataList: ContentSummary[]) => {
                            grp.forEach((el) => {
                                if (hasChildren) {
                                    el.setChildren(this.dataToTreeNodes(dataList, el));
                                }
                            });
                        }).catch((reason: any) => {
                            DefaultErrorHandler.handle(reason);
                        });
                    }).then(() => {
                        let rootList = this.getRoot().getCurrentRoot().treeToList();
                        this.initData(rootList);
                    })
                );
            }
        });

        return Q.all(parallelPromises).spread<void>(() => {
            return Q(null);
        }).catch((reason: any) => DefaultErrorHandler.handle(reason));
    }

    protected handleItemMetadata(row: number) {
        let node = this.getItem(row);
        if (this.isEmptyNode(node)) {
            return {cssClasses: 'empty-node'};
        }

        return null;
    }
}
