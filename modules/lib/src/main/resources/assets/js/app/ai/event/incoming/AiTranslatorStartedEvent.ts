import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class AiTranslatorStartedEvent
    extends Event {

    readonly path: string;

    private constructor() {
        super();
    }

    static on(handler: (event: AiTranslatorStartedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AiTranslatorStartedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
