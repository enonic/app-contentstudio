import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class ContentTreeGridLoadedEvent
    extends Event {

    static on(handler: (event: ContentTreeGridLoadedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentTreeGridLoadedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
