import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

type InteractionType = 'click';

export class AiContentOperatorInteractionEvent
    extends Event {

    path: string;

    interaction: InteractionType;

    private constructor() { // event is just to be received
        super();
    }

    static on(handler: (event: AiContentOperatorInteractionEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AiContentOperatorInteractionEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
