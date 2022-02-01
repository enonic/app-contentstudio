import Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {Viewer} from 'lib-admin-ui/ui/Viewer';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {Tooltip} from 'lib-admin-ui/ui/Tooltip';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {SelectionItem} from 'lib-admin-ui/app/browse/SelectionItem';

export class StatusSelectionItem
    extends SelectionItem<ContentSummaryAndCompareStatus> {

    protected item: ContentSummaryAndCompareStatus;
    private removeHandlerFn: () => void;
    private isRemovableFn: () => boolean;
    private clickTooltip: Tooltip;
    private removeClickTooltip: string = i18n('tooltip.list.itemRequired');
    private status: DivEl;

    constructor(viewer: Viewer<ContentSummaryAndCompareStatus>, item: ContentSummaryAndCompareStatus) {
        super(viewer, item);
    }

    public isRemovable(): boolean {
        if (!this.isRemovableFn || !this.removeHandlerFn) {
            return true;
        }

        return this.isRemovableFn();
    }

    setIsRemovableFn(fn: () => boolean) {
        this.isRemovableFn = fn;
    }

    setRemoveHandlerFn(fn: () => void) {
        this.removeHandlerFn = fn;
    }

    setRemoveButtonClickTooltip(text: string) {
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
            this.appendChild(this.status);

            return rendered;
        });
    }

    public setObject(obj: ContentSummaryAndCompareStatus) {
        const viewer = this.getViewer();
        this.status.removeClass(viewer.getObject().getStatusClass());

        viewer.setObject(obj);
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
