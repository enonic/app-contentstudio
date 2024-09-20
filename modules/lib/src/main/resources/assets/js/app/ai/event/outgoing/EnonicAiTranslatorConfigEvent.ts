import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {EnonicAiConfigData} from '../data/EnonicAiConfigData';

export class EnonicAiTranslatorConfigEvent
    extends Event {

    private readonly payload: EnonicAiConfigData;

    constructor(data: EnonicAiConfigData) {
        super();

        this.payload = data;
    }

    getData(): EnonicAiConfigData {
        return this.payload;
    }

    static on(handler: (event: EnonicAiTranslatorConfigEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiTranslatorConfigEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
