import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';

export class ContentTreeGridRefreshRequiredEvent
    extends Event {

    static on(handler: (event: ContentTreeGridRefreshRequiredEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentTreeGridRefreshRequiredEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
