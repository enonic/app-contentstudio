import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class EnonicAiStartEvent
    extends Event {

    private constructor() { // event is just to be received
        super();
    }

    static on(handler: (event: EnonicAiStartEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiStartEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}