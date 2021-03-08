import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';

export class BeforeContentSavedEvent
    extends Event {

    static on(handler: (event: BeforeContentSavedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: BeforeContentSavedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
