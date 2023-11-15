import {ContentTreeSelectorItemViewer} from '../../item/ContentTreeSelectorItemViewer';
import {ContentAndStatusTreeSelectorItem} from '../../item/ContentAndStatusTreeSelectorItem';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';

export class ContentAndStatusSelectorViewer extends ContentTreeSelectorItemViewer {

    doLayout(object: ContentAndStatusTreeSelectorItem) {
        super.doLayout(object);

        this.appendChild(this.createStatusColumn(object));
    }

    private createStatusColumn(item: ContentAndStatusTreeSelectorItem): DivEl {
        const content = ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(item.getContent(),
            item.getCompareStatus(),
            item.getPublishStatus());

        const statusElement = new DivEl('status');
        const statusTextEl = new SpanEl();
        statusTextEl.addClass(content.getStatusClass());
        statusTextEl.setHtml(content.getStatusText());
        statusElement.appendChild(statusTextEl);

        return statusElement;
    }
}
