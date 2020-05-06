import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {Event} from 'lib-admin-ui/event/Event';
import {NewSettingsItemEvent} from './NewSettingsItemEvent';

export class NewProjectEvent
    extends NewSettingsItemEvent {

    static on(handler: (event: NewProjectEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: NewProjectEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
