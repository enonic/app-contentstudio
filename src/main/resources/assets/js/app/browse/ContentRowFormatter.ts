import TreeNode = api.ui.treegrid.TreeNode;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import ContentSummaryAndCompareStatusViewer = api.content.ContentSummaryAndCompareStatusViewer;
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';
import {ContentAndStatusTreeSelectorItem} from '../item/ContentAndStatusTreeSelectorItem';

export class ContentRowFormatter {

    public static nameFormatter(_row: number, _cell: number, _value: any, _columnDef: any,
                                node: TreeNode<ContentSummaryAndCompareStatus>) {
        const data = node.getData();
        if (data.getContentSummary() || data.getUploadItem()) {
            let viewer = <ContentSummaryAndCompareStatusViewer> node.getViewer('name');
            if (!viewer) {
                viewer = new ContentSummaryAndCompareStatusViewer();
                node.setViewer('name', viewer);
            }
            viewer.setObject(node.getData(), node.calcLevel() > 1);
            return viewer ? viewer.toString() : '';
        }

        return '';
    }

    public static orderFormatter(_row: number, _cell: number, value: any, _columnDef: any,
                                 node: TreeNode<ContentSummaryAndCompareStatus>) {
        let wrapper = new api.dom.SpanEl();

        if (!api.util.StringHelper.isBlank(value)) {
            wrapper.getEl().setTitle(value);
        }

        if (node.getData().getContentSummary()) {
            let childOrder = node.getData().getContentSummary().getChildOrder();
            let icon;
            if (!childOrder.isDefault()) {
                let iconCls = 'sort-dialog-trigger ';
                if (!childOrder.isManual()) {
                    if (childOrder.isDesc()) {
                        iconCls += childOrder.isAlpha() ? 'icon-sort-alpha-desc' : 'icon-sort-num-desc';
                    } else {
                        iconCls += childOrder.isAlpha() ? 'icon-sort-alpha-asc' : 'icon-sort-num-asc';
                    }
                } else {
                    iconCls += 'icon-menu';
                }

                icon = new api.dom.DivEl(iconCls);
                wrapper.getEl().setInnerHtml(icon.toString(), false);
            }
        }
        return wrapper.toString();
    }

    public static statusFormatter({}: any, {}: any, {}: any, {}: any, dataContext: TreeNode<ContentSummaryAndCompareStatus>) {
        return ContentRowFormatter.doStatusFormat(dataContext.getData());
    }

    public static statusSelectorFormatter({}: any, {}: any, value: ContentTreeSelectorItem, {}: any, {}: any) {

        if (api.ObjectHelper.iFrameSafeInstanceOf(value, ContentAndStatusTreeSelectorItem)) {

            const item = <ContentAndStatusTreeSelectorItem>value;

            if (item.getCompareStatus() != null || item.getPublishStatus() != null) {
                return ContentRowFormatter.doStatusFormat(
                    ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(value.getContent(),
                        item.getCompareStatus(),
                        item.getPublishStatus()));
            }
        }

        return '';
    }

    private static doStatusFormat(data: ContentSummaryAndCompareStatus): string {

        if (data && data.getContentSummary()) {

            let status = new api.dom.SpanEl();

            status.addClass(data.getStatusClass());
            status.setHtml(data.getStatusText());

            return status.toString();
        }

        if (data.getUploadItem()) { // uploading node
            const compareStatusText = new api.ui.ProgressBar(data.getUploadItem().getProgress());
            return new api.dom.SpanEl().appendChild(compareStatusText).toString();
        }
    }
}
