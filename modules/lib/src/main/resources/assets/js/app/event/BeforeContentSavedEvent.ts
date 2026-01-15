import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class BeforeContentSavedEvent
    extends Event {

    static on(handler: (event: BeforeContentSavedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: BeforeContentSavedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
