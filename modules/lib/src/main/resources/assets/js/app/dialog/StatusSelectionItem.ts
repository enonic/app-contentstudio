import {SelectionItem} from '@enonic/lib-admin-ui/app/browse/SelectionItem';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Tooltip} from '@enonic/lib-admin-ui/ui/Tooltip';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class StatusSelectionItem
    extends SelectionItem<ContentSummaryAndCompareStatus> {

    declare protected item: ContentSummaryAndCompareStatus;
    protected status: DivEl;
    private removeHandlerFn: () => void;
    private isRemovableFn: () => boolean;
    private clickTooltip: Tooltip;
    private removeClickTooltip: string = i18n('tooltip.list.itemRequired');

    constructor(viewer: Viewer<ContentSummaryAndCompareStatus>, item: ContentSummaryAndCompareStatus) {
        super(viewer, item);
    }

    public isRemovable(): boolean {
        if (!this.isRemovableFn || !this.removeHandlerFn) {
            return true;
        }

        return this.isRemovableFn();
    }

    setIsRemovableFn(fn: () => boolean): void {
        this.isRemovableFn = fn;
    }

    setRemoveHandlerFn(fn: () => void): void {
        this.removeHandlerFn = fn;
    }

    setRemoveButtonClickTooltip(text: string): void {
        if (this.isRendered()) {
            this.clickTooltip.setText(text);
        } else {
            this.removeClickTooltip = text;
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.clickTooltip = new Tooltip(this.removeEl, this.removeClickTooltip);
            this.clickTooltip.setTrigger(Tooltip.TRIGGER_NONE);

            let onRemoveClicked = AppHelper.debounce(() => {
                Tooltip.hideOtherInstances();
                if (this.isRemovable()) {
                    this.removeHandlerFn();
                } else {
                    this.clickTooltip.showFor(1500);
                }
            }, 1000, true);

            this.onRemoveClicked(onRemoveClicked);

            this.removeEl.onMouseMove(e => { // stop propagating move event to parents, otherwise parent's tooltip shown
                e.stopPropagation();
            });

            this.status = this.initStatusDiv(this.item);
            this.status.insertBeforeEl(this.removeEl);

            return rendered;
        });
    }

    public setObject(obj: ContentSummaryAndCompareStatus) {
        const viewer = this.getViewer();
        viewer.setObject(obj);
        if (!this.status) {
            return;
        }

        this.status.removeClass(obj.getStatusClass());
        this.status.setHtml(obj.getStatusText());
        this.status.addClass(obj.getStatusClass());
    }

    private initStatusDiv(content: ContentSummaryAndCompareStatus) {

        let statusDiv = new DivEl('status');

        statusDiv.setHtml(content.getStatusText());
        statusDiv.addClass(content.getStatusClass());

        return statusDiv;
    }
}
