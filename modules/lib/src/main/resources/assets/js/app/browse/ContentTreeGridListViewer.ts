import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import Q from 'q';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {ProgressBar} from '@enonic/lib-admin-ui/ui/ProgressBar';
import {DateTimeFormatter} from '@enonic/lib-admin-ui/ui/treegrid/DateTimeFormatter';
import {SortContentEvent} from './sort/SortContentEvent';
import {ContentSummaryListViewer} from '../content/ContentSummaryListViewer';

export class ContentTreeGridListViewer
    extends DivEl {

    private item: ContentSummaryAndCompareStatus;

    private summaryViewer: ContentSummaryAndCompareStatusViewer;

    private sortColumn: DivEl;

    private statusColumn: StatusBlock;

    private modifiedColumn: DivEl;

    constructor() {
        super('content-tree-grid-list-viewer');

        this.initElements();
        this.initListeners();
    }

    private initElements(): void {
        this.summaryViewer = new ContentSummaryListViewer();
        this.sortColumn = new DivEl();
        this.statusColumn = new StatusBlock();
        this.modifiedColumn = new DivEl('content-tree-grid-modified');
    }

    private initListeners(): void {
        this.sortColumn.onClicked(() => {
            if (this.sortColumn.hasClass('sort-dialog-trigger')) {
                new SortContentEvent([this.item]).fire();
            }
        });
    }

    setItem(item: ContentSummaryAndCompareStatus) {
        this.item = item;
        this.summaryViewer.setObject(item);
        this.sortColumn.setClass(this.calcSortIconCls());
        this.statusColumn.setItem(item);
        this.modifiedColumn.setHtml(DateTimeFormatter.createHtml(item.getContentSummary().getModifiedTime()));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(this.summaryViewer);
            this.appendChild(this.sortColumn);
            this.appendChild(this.statusColumn);
            this.appendChild(this.modifiedColumn);

            return rendered;
        });
    }

    private calcSortIconCls(): string {
        const childOrder = this.item.getContentSummary().getChildOrder();

        let iconCls = 'content-tree-grid-sort ';

        if (!childOrder.isDefault()) {
            iconCls += 'sort-dialog-trigger ';

            if (!childOrder.isManual()) {
                if (childOrder.isDesc()) {
                    iconCls += childOrder.isAlpha() ? 'icon-sort-alpha-desc' : 'icon-sort-num-desc';
                } else {
                    iconCls += childOrder.isAlpha() ? 'icon-sort-alpha-asc' : 'icon-sort-num-asc';
                }
            } else {
                iconCls += 'icon-menu';
            }
        }

        return iconCls;
    }
}

class StatusBlock
    extends DivEl {

    private item: ContentSummaryAndCompareStatus;

    private statusEl: SpanEl;

    private progressEl?: ProgressBar;

    constructor() {
        super('content-tree-grid-status');

        this.statusEl = new SpanEl('status-text');
    }

    setItem(item: ContentSummaryAndCompareStatus): void {
        this.item = item;

        if (item.getUploadItem()) {
            this.updateProgressBar();
        } else {
            this.updateStatus();
        }
    }

    private updateStatus(): void {
        this.progressEl?.remove();
        this.statusEl.setHtml(this.item.getStatusText());
        this.statusEl.setClass(this.item.getStatusClass());
    }

    private updateProgressBar(): void {
        if (!this.progressEl) {
            this.progressEl = new ProgressBar(this.item.getUploadItem().getProgress());
        } else {
            this.progressEl.setValue(this.item.getUploadItem().getProgress());
        }

        if (!this.statusEl.hasChild(this.progressEl)) {
            this.statusEl.setHtml('');
            this.statusEl.setClass('');
            this.statusEl.appendChild(this.progressEl);
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(this.statusEl);

            return rendered;
        });
    }
}
