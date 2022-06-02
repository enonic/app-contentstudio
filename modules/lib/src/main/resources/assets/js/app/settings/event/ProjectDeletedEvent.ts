import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ProjectServerEvent} from './ProjectServerEvent';

export class ProjectDeletedEvent extends ProjectServerEvent {

    static on(handler: (event: ProjectDeletedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ProjectDeletedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
