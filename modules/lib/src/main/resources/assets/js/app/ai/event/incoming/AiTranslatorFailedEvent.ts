import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class AiTranslatorFailedEvent
    extends Event {

    readonly path: string;

    readonly text: string;

    private constructor() {
        super();
    }

    static on(handler: (event: AiTranslatorFailedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AiTranslatorFailedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
