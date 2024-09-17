import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {EnonicAiContentData} from '../data/EnonicAiContentData';

export class EnonicAiContentOperatorDataSentEvent
    extends Event {

    private readonly payload: EnonicAiContentData;

    constructor(data: EnonicAiContentData) {
        super();

        this.payload = data;
    }

    getData(): EnonicAiContentData {
        return this.payload;
    }

    static on(handler: (event: EnonicAiContentOperatorDataSentEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiContentOperatorDataSentEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
