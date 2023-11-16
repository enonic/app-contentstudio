import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import Q from 'q';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {ContentRowFormatter} from './ContentRowFormatter';
import {DateTimeFormatter} from '@enonic/lib-admin-ui/ui/treegrid/DateTimeFormatter';

export class ContentTreeView extends DivEl {

    private readonly contentViewer: ContentSummaryAndCompareStatusViewer;

    private readonly orderColumn: DivEl;

    private readonly statusColumn: DivEl;

    private readonly modifiedColumn: DivEl;

    constructor() {
        super('content-tree-view');

        this.contentViewer = new ContentSummaryAndCompareStatusViewer();
        this.orderColumn = new DivEl('order-column');
        this.statusColumn = new DivEl('status-column');
        this.modifiedColumn = new DivEl('modified-column');
    }

    setContent(content: ContentSummaryAndCompareStatus): void {
        this.contentViewer.setObject(content);
        this.statusColumn.setHtml(content.getStatusText());
        this.statusColumn.setClass(`status-column ${content.getStatusClass()}`);
        this.modifiedColumn.setHtml(DateTimeFormatter.createHtml(content.getContentSummary().getModifiedTime()));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.contentViewer, this.orderColumn, this.statusColumn, this.modifiedColumn);

            return rendered;
        });
    }
}
