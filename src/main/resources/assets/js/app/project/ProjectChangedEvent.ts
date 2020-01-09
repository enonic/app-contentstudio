import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {Event} from 'lib-admin-ui/event/Event';

export class ProjectChangedEvent
    extends Event {

    static on(handler: (event: ProjectChangedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ProjectChangedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
