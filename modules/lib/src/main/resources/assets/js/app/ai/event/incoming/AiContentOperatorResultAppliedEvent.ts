import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class AiContentOperatorResultAppliedEvent
    extends Event {

    items: { path: string, text: string }[];

    private constructor() { // event is just to be received
        super();
    }

    static on(handler: (event: AiContentOperatorResultAppliedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AiContentOperatorResultAppliedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
