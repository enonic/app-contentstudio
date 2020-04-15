import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';

export class AfterContentSavedEvent
    extends Event {

    static on(handler: (event: AfterContentSavedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AfterContentSavedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
