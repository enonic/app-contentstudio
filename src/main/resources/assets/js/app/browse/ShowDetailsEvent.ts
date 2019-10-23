import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';

import {BaseContentModelEvent} from './BaseContentModelEvent';

export class ShowDetailsEvent extends BaseContentModelEvent {

    static on(handler: (event: ShowDetailsEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ShowDetailsEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
