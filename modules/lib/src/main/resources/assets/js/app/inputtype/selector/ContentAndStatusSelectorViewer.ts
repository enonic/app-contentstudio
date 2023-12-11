import {ContentTreeSelectorItemViewer} from '../../item/ContentTreeSelectorItemViewer';
import {ContentAndStatusTreeSelectorItem} from '../../item/ContentAndStatusTreeSelectorItem';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';

export class ContentAndStatusSelectorViewer extends ContentTreeSelectorItemViewer {

    private statusColumn: DivEl;

    doLayout(object: ContentAndStatusTreeSelectorItem) {
        super.doLayout(object);

        if (!this.statusColumn) {
            this.statusColumn = this.createStatusColumn(object);
            this.appendChild(this.statusColumn);
        }
    }

    private createStatusColumn(item: ContentAndStatusTreeSelectorItem): DivEl {
        const content = this.makeContentFromItem(item);
        const statusElement = new DivEl('status');
        const statusTextEl = new SpanEl();
        statusTextEl.addClass(content.getStatusClass());
        statusTextEl.setHtml(content.getStatusText());
        statusElement.appendChild(statusTextEl);

        return statusElement;
    }


    private makeContentFromItem(item: ContentAndStatusTreeSelectorItem): ContentSummaryAndCompareStatus {
        return ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(item.getContent(),
            item.getCompareStatus(),
            item.getPublishStatus());
    }
}
