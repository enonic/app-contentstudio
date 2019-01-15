import {SlidablePanel, SlidablePanelBuilder, SLIDE_FROM} from './SlidablePanel';
import {ContextView} from './ContextView';
import {CONTEXT_PANEL_TYPE} from './ContextPanel';

export class MobileContextPanel
    extends SlidablePanel {

    constructor(contextView: ContextView) {
        super(new SlidablePanelBuilder().setSlideFrom(SLIDE_FROM.BOTTOM), contextView);
        this.addClass('mobile');
    }

    protected slideOutTop() {
        this.getEl().setTopPx(api.BrowserHelper.isIOS() ? -window.innerHeight : -window.outerHeight);
    }

    protected slideOutBottom() {
        this.getEl().setTopPx(api.BrowserHelper.isIOS() ? window.innerHeight : window.outerHeight);
    }

    public getType(): CONTEXT_PANEL_TYPE {
        return CONTEXT_PANEL_TYPE.MOBILE;
    }
}
