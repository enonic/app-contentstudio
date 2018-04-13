import '../../../../../api.ts';
import {WidgetItemView} from '../../WidgetItemView';
import CompareStatus = api.content.CompareStatus;
import PublishStatus = api.content.PublishStatus;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;

export class StatusWidgetItemView extends WidgetItemView {

    private content: ContentSummaryAndCompareStatus;

    public static debug: boolean = false;

    constructor() {
        super('status-widget-item-view');
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): wemQ.Promise<any> {
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
                              (compareStatus === CompareStatus.NEW && timePublished(item) !== timePublished(this.content));
        if (statusChanged) {
            this.content = item;
            return this.layout();
        }
        return wemQ<any>(null);
    }

    private getCompareStatus() : CompareStatus {
        return this.content ? this.content.getCompareStatus() : null;
    }

    private getPublishStatus() : PublishStatus {
        return this.content ? this.content.getPublishStatus() : null;
    }

    public layout(): wemQ.Promise<any> {
        if (StatusWidgetItemView.debug) {
            console.debug('StatusWidgetItemView.layout');
        }

        return super.layout().then(() => {
            if (this.getCompareStatus() != null) {
                let statusEl = new api.dom.SpanEl();

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
