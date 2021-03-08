import {CONTEXT_PANEL_TYPE, ContextPanel} from './ContextPanel';
import {ContextView} from './ContextView';

export class DockedContextPanel
    extends ContextPanel {

    constructor(contextView: ContextView) {
        super(contextView);
        this.setDoOffset(false);
        this.addClass('docked-context-panel');
    }

    protected subscribeOnEvents() {
        this.onPanelSizeChanged(() => this.contextView.updateContextContainerHeight());

        this.onShown(() => {
            if (this.getItem()) {
                // small delay so that isVisibleOrAboutToBeVisible() check detects width change
                setTimeout(() => this.contextView.updateActiveWidget(), 250);
            }
        });
    }

    public isVisibleOrAboutToBeVisible(): boolean {
        return this.getHTMLElement().clientWidth > 0;
    }

    public getType(): CONTEXT_PANEL_TYPE {
        return CONTEXT_PANEL_TYPE.DOCKED;
    }
}
