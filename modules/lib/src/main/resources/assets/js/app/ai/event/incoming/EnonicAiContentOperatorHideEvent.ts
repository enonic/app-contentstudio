import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class EnonicAiContentOperatorHideEvent
    extends Event {

    private constructor() {
        super();
    }

    static on(handler: (event: EnonicAiContentOperatorHideEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiContentOperatorHideEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
