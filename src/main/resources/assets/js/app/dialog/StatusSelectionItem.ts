import '../../api.ts';

import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import BrowseItem = api.app.browse.BrowseItem;
import Tooltip = api.ui.Tooltip;
import i18n = api.util.i18n;

export class StatusSelectionItem extends api.app.browse.SelectionItem<ContentSummaryAndCompareStatus> {

    private removeHandlerFn: () => void;
    private isRemovableFn: () => boolean;

    constructor(viewer: api.ui.Viewer<ContentSummaryAndCompareStatus>, item: BrowseItem<ContentSummaryAndCompareStatus>) {
        super(viewer, item);

        let onRemoveClicked = api.util.AppHelper.debounce(() => {
            Tooltip.hideOtherInstances();
            if (this.isRemovable()) {
                this.removeHandlerFn();
            } else {
                let tooltip = new Tooltip(this.getRemoveButton(), i18n('dialog.publish.itemRequired'));
                tooltip.setTrigger(Tooltip.TRIGGER_NONE);
                tooltip.showFor(1500);
            }
        }, 1000, true);

        this.onRemoveClicked(onRemoveClicked);
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

    setRemoveButtonTooltip(tooltipText: string) {
        this.removeEl.getEl().setTitle(tooltipText);
        this.removeEl.onMouseMove(e => { // stop propagating move event to parents, otherwise parent's tooltip shown
            e.stopPropagation();
        });
    }

    doRender(): wemQ.Promise<boolean> {
        return super.doRender().then((rendered) => {

            let statusDiv = this.initStatusDiv(this.item.getModel());
            this.appendChild(statusDiv);

            return rendered;
        });
    }

    private initStatusDiv(content:ContentSummaryAndCompareStatus) {

        let statusDiv = new api.dom.DivEl('status');

        statusDiv.setHtml(content.getStatusText());
        statusDiv.addClass(content.getStatusClass());

        return statusDiv;
    }
}
