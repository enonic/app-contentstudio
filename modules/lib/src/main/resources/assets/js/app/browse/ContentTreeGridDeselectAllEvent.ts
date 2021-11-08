import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';

export class ContentTreeGridDeselectAllEvent
    extends Event {

    static on(handler: (event: ContentTreeGridDeselectAllEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentTreeGridDeselectAllEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
