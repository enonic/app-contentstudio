import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class ReloadActiveExtensionEvent extends Event {

    static on(handler: (event: ReloadActiveExtensionEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ReloadActiveExtensionEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
