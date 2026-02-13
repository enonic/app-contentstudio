import {ContextPanel} from './ContextPanel';
import {type ContextView} from './ContextView';
import {type DivEl} from '@enonic/lib-admin-ui/dom/DivEl';

export class DockedContextPanel
    extends ContextPanel {

    constructor(contextView: ContextView) {
        super(contextView);
        this.setDoOffset(false);
        this.addClass('docked-context-panel');
    }

    protected subscribeOnEvents() {
        this.onPanelSizeChanged(() => {
            const contextContainer: DivEl = this.contextView.getContextContainer();
            const panelHeight = this.getEl().getHeight();
            const panelOffset = this.getEl().getOffsetToParent();
            const containerHeight = contextContainer.getEl().getHeight();
            const containerOffset = contextContainer.getEl().getOffsetToParent();

            if (containerOffset.top > 0 && containerHeight !== (panelHeight - panelOffset.top - containerOffset.top)) {
                contextContainer.getEl().setHeightPx(panelHeight - panelOffset.top - containerOffset.top);
            }
        });

        this.onShown(() => {
            if (this.getItem()) {
                // small delay so that isVisibleOrAboutToBeVisible() check detects width change
                window.setTimeout(() => void this.contextView.updateActiveWidget(), 250);
            }
        });
    }

    public isVisibleOrAboutToBeVisible(): boolean {
        return this.getHTMLElement().clientWidth > 0;
    }
}
