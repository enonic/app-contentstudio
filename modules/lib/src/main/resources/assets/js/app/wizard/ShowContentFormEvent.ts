import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';

export class ShowContentFormEvent
    extends Event {

    static on(handler: (event: ShowContentFormEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ShowContentFormEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
