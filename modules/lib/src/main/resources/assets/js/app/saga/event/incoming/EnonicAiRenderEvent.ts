import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class EnonicAiRenderEvent
    extends Event {

    private constructor() {
        super();
    }

    static on(handler: (event: EnonicAiRenderEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiRenderEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
