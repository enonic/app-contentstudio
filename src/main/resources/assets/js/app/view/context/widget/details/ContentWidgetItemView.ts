import {WidgetItemView} from '../../WidgetItemView';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import ContentSummaryViewer = api.content.ContentSummaryViewer;

export class ContentWidgetItemView
    extends WidgetItemView {

    private viewer: ContentSummaryViewer;

    constructor() {
        super('content-widget-item-view');
        this.initViewer();
    }

    private initViewer() {
        this.viewer = new ContentSummaryViewer();
        this.viewer.addClass('context-panel-label');
        this.appendChild(this.viewer);
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): wemQ.Promise<any> {
        if (item) {
            this.viewer.setObject(item.getContentSummary());
        }

        return wemQ(item);
    }
}
