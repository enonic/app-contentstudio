import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';
import {ContentAndStatusTreeSelectorItem} from '../item/ContentAndStatusTreeSelectorItem';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {ProgressBar} from 'lib-admin-ui/ui/ProgressBar';
import {MediaTreeSelectorItem} from '../inputtype/ui/selector/media/MediaTreeSelectorItem';

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
            viewer.setIsRelativePath(node.calcLevel() > 1);
            viewer.setObject(node.getData());
            return viewer ? viewer.toString() : '';
        }

        return '';
    }

    public static orderFormatter(_row: number, _cell: number, value: any, _columnDef: any,
                                 node: TreeNode<ContentSummaryAndCompareStatus>) {
        let wrapper = new SpanEl();

        if (!StringHelper.isBlank(value)) {
            wrapper.setTitle(value);
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

                icon = new DivEl(iconCls);
                wrapper.appendChild(icon);
            }
        }
        return wrapper.toString();
    }

    public static statusFormatter({}: any, {}: any, {}: any, {}: any, dataContext: TreeNode<ContentSummaryAndCompareStatus>) {
        return ContentRowFormatter.doStatusFormat(dataContext.getData());
    }

    public static statusSelectorFormatter({}: any, {}: any, value: ContentTreeSelectorItem, {}: any, {}: any) {

        if (ObjectHelper.iFrameSafeInstanceOf(value, ContentAndStatusTreeSelectorItem) ||
            ObjectHelper.iFrameSafeInstanceOf(value, MediaTreeSelectorItem)) {

            const item = <ContentAndStatusTreeSelectorItem>value;
            if (item.isSelectable() && (item.getCompareStatus() != null || item.getPublishStatus() != null)) {
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

            let status = new SpanEl();

            status.addClass(data.getStatusClass());
            status.setHtml(data.getStatusText());

            return status.toString();
        }

        if (data.getUploadItem()) { // uploading node
            const compareStatusText = new ProgressBar(data.getUploadItem().getProgress());
            return new SpanEl().appendChild(compareStatusText).toString();
        }
    }
}
