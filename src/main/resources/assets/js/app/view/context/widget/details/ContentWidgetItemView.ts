import {WidgetItemView} from '../../WidgetItemView';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusViewer} from '../../../../content/ContentSummaryAndCompareStatusViewer';

export class ContentWidgetItemView
    extends WidgetItemView {

    private viewer: ContentSummaryAndCompareStatusViewer;

    constructor() {
        super('content-widget-item-view');
        this.initViewer();
    }

    private initViewer() {
        this.viewer = new ContentSummaryAndCompareStatusViewer();
        this.viewer.addClass('context-panel-label');
        this.appendChild(this.viewer);
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): wemQ.Promise<any> {
        if (item) {
            this.viewer.setObject(item);
        }

        return wemQ(item);
    }
}
