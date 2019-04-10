import {PageView} from './PageView';
import {SelectedByClickEvent} from './SelectedByClickEvent';

export class PageSelectedEvent
    extends SelectedByClickEvent {

    private pageView: PageView;

    constructor(pageView: PageView, rightClicked?: boolean) {
        super(rightClicked);
        this.pageView = pageView;
    }

    getPageView(): PageView {
        return this.pageView;
    }

    static on(handler: (event: PageSelectedEvent) => void, contextWindow: Window = window) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: PageSelectedEvent) => void, contextWindow: Window = window) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }
}
