import Q from 'q';
import {WidgetItemView} from '../../WidgetItemView';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {CompareStatus} from '../../../../content/CompareStatus';
import {PublishStatus} from '../../../../publish/PublishStatus';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';

export class StatusWidgetItemView extends WidgetItemView {

    private content: ContentSummaryAndCompareStatus;

    public static debug: boolean = false;

    constructor() {
        super('status-widget-item-view');
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<void> {
        let compareStatus = item.getCompareStatus();
        let publishStatus = item.getPublishStatus();
        if (StatusWidgetItemView.debug) {
            console.debug('StatusWidgetItemView.setCompareStatus: ', compareStatus);
            console.debug('StatusWidgetItemView.setPublishStatus: ', publishStatus);
        }
        const timePublished = content =>
            content && content.getContentSummary() && content.getContentSummary().getPublishFirstTime() || 0;
        const statusChanged = publishStatus !== this.getPublishStatus() ||
                                compareStatus !== this.getCompareStatus() ||
                                this.content.isMovedAndModified() !== item.isMovedAndModified() ||
                                (compareStatus === CompareStatus.NEW && timePublished(item) !== timePublished(this.content));
        if (statusChanged) {
            this.content = item;
            return this.layout();
        }
        return Q();
    }

    private getCompareStatus() : CompareStatus {
        return this.content ? this.content.getCompareStatus() : null;
    }

    private getPublishStatus() : PublishStatus {
        return this.content ? this.content.getPublishStatus() : null;
    }

    public layout(): Q.Promise<void> {
        if (StatusWidgetItemView.debug) {
            console.debug('StatusWidgetItemView.layout');
        }

        return super.layout().then(() => {
            if (this.getCompareStatus() != null) {
                let statusEl = new SpanEl();

                statusEl.setHtml(this.content.getStatusText().toLocaleUpperCase());
                statusEl.addClass(this.content.getStatusClass());

                this.removeChildren();
                this.appendChild(statusEl);
            } else {
                this.removeChildren();
            }
        });
    }
}
