import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class AiContentOperatorContextChangedEvent
    extends Event {

    context: string;

    private constructor() { // event is just to be received
        super();
    }

    static on(handler: (event: AiContentOperatorContextChangedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AiContentOperatorContextChangedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
