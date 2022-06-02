import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class ReloadActiveWidgetEvent extends Event {

    static on(handler: (event: ReloadActiveWidgetEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ReloadActiveWidgetEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
