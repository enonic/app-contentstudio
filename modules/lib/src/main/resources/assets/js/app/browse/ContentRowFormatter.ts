import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProgressBar} from '@enonic/lib-admin-ui/ui/ProgressBar';
import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {ContentSummaryListViewer} from '../content/ContentSummaryListViewer';
import {MediaTreeSelectorItem} from '../inputtype/ui/selector/media/MediaTreeSelectorItem';
import {ContentAndStatusTreeSelectorItem} from '../item/ContentAndStatusTreeSelectorItem';
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';

export class ContentRowFormatter {

    public static nameFormatter(_row: number, _cell: number, _value: unknown, _columnDef: unknown,
                                node: TreeNode<ContentSummaryAndCompareStatus>): string {
        const data = node.getData();
        if (data.getContentSummary() || data.getUploadItem()) {
            let viewer = node.getViewer('name') as ContentSummaryAndCompareStatusViewer;
            if (!viewer) {
                viewer = new ContentSummaryListViewer();
                node.setViewer('name', viewer);
            }
            viewer.setIsRelativePath(node.calcLevel() > 1);
            viewer.setObject(node.getData());
            return viewer ? viewer.toString() : '';
        }

        return '';
    }

    public static orderFormatter(_row: number, _cell: number, value: string, _columnDef: object,
                                 node: TreeNode<ContentSummaryAndCompareStatus>): string {
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

    public static statusFormatter(_row: number, _cell: number, value: number, _columnDef: object,
                                  dataContext: TreeNode<ContentSummaryAndCompareStatus>): string {
        return ContentRowFormatter.doStatusFormat(dataContext.getData());
    }

    public static statusSelectorFormatter(_row: number, _cell: number, value: ContentTreeSelectorItem): string {

        if (ObjectHelper.iFrameSafeInstanceOf(value, ContentAndStatusTreeSelectorItem) ||
            ObjectHelper.iFrameSafeInstanceOf(value, MediaTreeSelectorItem)) {

            const item = value as ContentAndStatusTreeSelectorItem;
            if (item.isSelectable() && (item.getCompareStatus() != null || item.getPublishStatus() != null)) {
                return ContentRowFormatter.doStatusFormat(
                    ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(value.getContent(),
                        item.getCompareStatus(),
                        item.getPublishStatus()));
            }
        }

        return '';
    }

    static doStatusFormat(data: ContentSummaryAndCompareStatus): string {

        if (data?.getContentSummary()) {

            let status = new SpanEl();

            status.addClass(data.getStatusClass());
            status.setHtml(data.getStatusText());

            return status.toString();
        }

        if (data.getUploadItem()) { // uploading node
            const compareStatusText = new ProgressBar(data.getUploadItem().getProgress());
            const wrapper: SpanEl = new SpanEl();
            wrapper.getEl().setWidth('100%');
            return wrapper.appendChild(compareStatusText).toString();
        }
    }
}
