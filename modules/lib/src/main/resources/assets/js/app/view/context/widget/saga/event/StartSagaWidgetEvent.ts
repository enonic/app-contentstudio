import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class StartSagaWidgetEvent
    extends Event {

    constructor() {
        super();
    }

    static on(handler: (event: StartSagaWidgetEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: StartSagaWidgetEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
