import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {EnonicAiAssistantData} from '../data/EnonicAiAssistantData';

export class EnonicAiDataSentEvent
    extends Event {

    private readonly payload: EnonicAiAssistantData;

    constructor(data: EnonicAiAssistantData) {
        super();

        this.payload = data;
    }

    getData(): EnonicAiAssistantData {
        return this.payload;
    }

    static on(handler: (event: EnonicAiDataSentEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiDataSentEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
