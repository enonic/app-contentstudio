import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ResultData} from '../data/EnonicAiAssistantData';

export class EnonicAIApplyEvent
    extends Event {

    result: ResultData;

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
