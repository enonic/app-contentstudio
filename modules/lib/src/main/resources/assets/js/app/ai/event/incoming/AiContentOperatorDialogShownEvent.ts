import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class AiContentOperatorDialogShownEvent
    extends Event {

    private constructor() { // event is just to be received
        super();
    }

    static on(handler: (event: AiContentOperatorDialogShownEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AiContentOperatorDialogShownEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
