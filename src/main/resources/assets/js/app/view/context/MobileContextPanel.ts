import {SlidablePanel, SlidablePanelBuilder, SLIDE_FROM} from './SlidablePanel';
import {ContextView} from './ContextView';
import {CONTEXT_PANEL_TYPE} from './ContextPanel';
import {BrowserHelper} from 'lib-admin-ui/BrowserHelper';

export class MobileContextPanel
    extends SlidablePanel {

    constructor(contextView: ContextView) {
        super(new SlidablePanelBuilder().setSlideFrom(SLIDE_FROM.BOTTOM), contextView);
        this.addClass('mobile');
    }

    protected slideOutTop() {
        this.getEl().setTopPx(BrowserHelper.isIOS() ? -window.innerHeight : -window.outerHeight);
    }

    protected slideOutBottom() {
        this.getEl().setTopPx(BrowserHelper.isIOS() ? window.innerHeight : window.outerHeight);
    }

    public getType(): CONTEXT_PANEL_TYPE {
        return CONTEXT_PANEL_TYPE.MOBILE;
    }
}
