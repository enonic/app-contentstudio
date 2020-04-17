import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ProjectServerEvent} from './ProjectServerEvent';

export class ProjectUpdatedEvent extends ProjectServerEvent {

    static on(handler: (event: ProjectUpdatedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ProjectUpdatedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
