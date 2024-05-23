import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {EnonicAiAppliedRawData} from '../data/EnonicAiAppliedData';

export class EnonicAIApplyEvent
    extends Event {

    result: EnonicAiAppliedRawData;

    private constructor() { // event is just to be received
        super();
    }

    static on(handler: (event: EnonicAIApplyEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAIApplyEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
