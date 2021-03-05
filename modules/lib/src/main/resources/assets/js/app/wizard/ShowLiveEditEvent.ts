import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';

export class ShowLiveEditEvent
    extends Event {

    static on(handler: (event: ShowLiveEditEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ShowLiveEditEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
