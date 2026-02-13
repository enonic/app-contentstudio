import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {type AiData} from '../data/AiData';

export class AiUpdateDataEvent
    extends Event {

    private readonly payload: AiData;

    constructor(data: AiData) {
        super();

        this.payload = data;
    }

    getData(): AiData {
        return this.payload;
    }

    static on(handler: (event: AiUpdateDataEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AiUpdateDataEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
