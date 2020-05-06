import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {PageView} from './PageView';

export class LiveEditPageViewReadyEvent
    extends Event {

    private pageView: PageView;

    constructor(pageView?: PageView) {
        super();
        if (pageView) {
            this.pageView = pageView;
        }
    }

    getPageView(): PageView {
        return this.pageView;
    }

    static on(handler: (event: LiveEditPageViewReadyEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: LiveEditPageViewReadyEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
