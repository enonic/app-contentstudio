import {TreeGrid} from 'lib-admin-ui/ui/treegrid/TreeGrid';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {TreeGridBuilder} from 'lib-admin-ui/ui/treegrid/TreeGridBuilder';
import {DateTimeFormatter} from 'lib-admin-ui/ui/treegrid/DateTimeFormatter';
import {ContentSummaryViewer} from 'lib-admin-ui/content/ContentSummaryViewer';
import {ChildOrder} from 'lib-admin-ui/content/order/ChildOrder';
import {ContentSummaryAndCompareStatusFetcher} from '../../resource/ContentSummaryAndCompareStatusFetcher';
import {ContentResponse} from '../../resource/ContentResponse';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentId} from 'lib-admin-ui/content/ContentId';

export class SortContentTreeGrid extends TreeGrid<ContentSummaryAndCompareStatus> {

    private contentId: ContentId;

    private curChildOrder: ChildOrder;

    static MAX_FETCH_SIZE: number = 30;

    constructor() {
        super(new TreeGridBuilder<ContentSummaryAndCompareStatus>()
            .setColumnConfig([{
                name: 'Name',
                id: 'displayName',
                field: 'contentSummary.displayName',
                formatter: SortContentTreeGrid.nameFormatter,
                style: {minWidth: 130},
                behavior: 'selectAndMove'
            }, {
                name: 'ModifiedTime',
                id: 'modifiedTime',
                field: 'contentSummary.modifiedTime',
                formatter: DateTimeFormatter.format,
                style: {cssClass: 'modified', minWidth: 150, maxWidth: 170},
                behavior: 'selectAndMove'
            }])
            .setPartialLoadEnabled(true)
            .setLoadBufferSize(20)
            .setAutoLoad(false)
            .setCheckableRows(false)
            .setShowToolbar(false)
            .setDragAndDrop(true)
            .disableMultipleSelection(true)
            .prependClasses('content-tree-grid')
            .setSelectedCellCssClass('selected-sort-row')
        );

        this.getOptions().setHeight('100%');
    }

    public static nameFormatter(row: number, cell: number, value: any, columnDef: any, node: TreeNode<ContentSummaryAndCompareStatus>) {
        const data = node.getData();
        if (data.getContentSummary()) {
            let viewer: ContentSummaryViewer = <ContentSummaryViewer>node.getViewer('name');
            if (!viewer) {
                viewer = new ContentSummaryViewer();
                viewer.setIsRelativePath(node.calcLevel() > 1);
                viewer.setObject(node.getData().getContentSummary());
                node.setViewer('name', viewer);
            }
            return viewer.toString();

        }

        return '';
    }

    isEmptyNode(node: TreeNode<ContentSummaryAndCompareStatus>): boolean {
        const data = node.getData();
        return !data.getContentSummary();
    }

    sortNodeChildren(node: TreeNode<ContentSummaryAndCompareStatus>) {
        this.initData(this.getRoot().getCurrentRoot().treeToList());
    }

    fetchChildren(): Q.Promise<ContentSummaryAndCompareStatus[]> {
        let parentContentId: ContentId;
        let parentNode = this.getRoot().getCurrentRoot();
        if (parentNode.getData()) {
            parentContentId = parentNode.getData().getContentSummary().getContentId();
            this.contentId = parentContentId;
            parentNode.setData(null);
        } else {
            parentContentId = this.contentId;
        }

        let from = parentNode.getChildren().length;
        if (from > 0 && !parentNode.getChildren()[from - 1].getData().getContentSummary()) {
            parentNode.getChildren().pop();
            from--;
        }

        return ContentSummaryAndCompareStatusFetcher.fetchChildren(parentContentId, from, SortContentTreeGrid.MAX_FETCH_SIZE,
            this.curChildOrder).then((data: ContentResponse<ContentSummaryAndCompareStatus>) => {
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

    }

    hasChildren(data: ContentSummaryAndCompareStatus): boolean {
        return data.hasChildren();
    }

    getDataId(data: ContentSummaryAndCompareStatus): string {
        return data.getId();
    }

    getContentId() {
        return this.contentId;
    }

    getChildOrder(): ChildOrder {
        return this.curChildOrder;
    }

    setChildOrder(value: ChildOrder) {
        this.curChildOrder = value;
    }

    reset() {
        this.setChildOrder(null);
        this.getGrid().getDataView().setItems([]);
        this.getGrid().resizeCanvas();
    }

}
