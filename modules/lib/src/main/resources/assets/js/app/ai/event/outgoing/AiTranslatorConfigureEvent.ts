import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {type EnonicAiConfigData} from '../data/EnonicAiConfigData';

export class AiTranslatorConfigureEvent
    extends Event {

    private readonly payload: EnonicAiConfigData;

    constructor(data: EnonicAiConfigData) {
        super();

        this.payload = data;
    }

    getData(): EnonicAiConfigData {
        return this.payload;
    }

    static on(handler: (event: AiTranslatorConfigureEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AiTranslatorConfigureEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
