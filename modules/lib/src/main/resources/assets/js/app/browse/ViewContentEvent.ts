import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {BaseContentModelEvent} from './BaseContentModelEvent';

export class ViewContentEvent extends BaseContentModelEvent {

    static on(handler: (event: ViewContentEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ViewContentEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
