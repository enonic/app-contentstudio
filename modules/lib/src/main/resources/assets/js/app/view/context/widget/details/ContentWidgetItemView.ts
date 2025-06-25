import Q from 'q';
import {WidgetItemView} from '../../WidgetItemView';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusViewer} from '../../../../content/ContentSummaryAndCompareStatusViewer';

/**
 * @deprecated Use DetailsWidgetElement instead
 */
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

    getViewer(): ContentSummaryAndCompareStatusViewer {
        return this.viewer;
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<void> {
        if (item) {
            this.viewer.setObject(item);
        }

        return Q();
    }
}
