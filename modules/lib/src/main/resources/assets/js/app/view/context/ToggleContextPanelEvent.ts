import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';

export class ToggleContextPanelEvent
    extends Event {

    static on(handler: (event: ToggleContextPanelEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ToggleContextPanelEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
