import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class EnonicAiTranslatorStartedEvent
    extends Event {

    readonly path: string;

    private constructor() {
        super();
    }

    static on(handler: (event: EnonicAiTranslatorStartedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiTranslatorStartedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
