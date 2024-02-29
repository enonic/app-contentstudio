import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class EnonicAiStopEvent
    extends Event {

    private constructor() { // event is just to be received
        super();
    }

    static on(handler: (event: EnonicAiStopEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiStopEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
