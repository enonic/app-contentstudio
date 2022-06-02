import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
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
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: PageSelectedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
