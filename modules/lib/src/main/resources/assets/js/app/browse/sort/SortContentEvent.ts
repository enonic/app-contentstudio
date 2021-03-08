import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {BaseContentModelEvent} from '../BaseContentModelEvent';

export class SortContentEvent extends BaseContentModelEvent {

    static on(handler: (event: SortContentEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: SortContentEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
