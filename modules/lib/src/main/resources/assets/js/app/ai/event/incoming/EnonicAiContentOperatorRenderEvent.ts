import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class EnonicAiContentOperatorRenderEvent
    extends Event {

    private constructor() {
        super();
    }

    static on(handler: (event: EnonicAiContentOperatorRenderEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiContentOperatorRenderEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
