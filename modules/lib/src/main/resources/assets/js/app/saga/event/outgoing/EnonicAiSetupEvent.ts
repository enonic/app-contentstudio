import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {EnonicAiSetupData} from '../data/EnonicAiSetupData';

export class EnonicAiSetupEvent
    extends Event {

    private readonly payload: EnonicAiSetupData;

    constructor(data: EnonicAiSetupData) {
        super();

        this.payload = data;
    }

    getData(): EnonicAiSetupData {
        return this.payload;
    }

    static on(handler: (event: EnonicAiSetupEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiSetupEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
