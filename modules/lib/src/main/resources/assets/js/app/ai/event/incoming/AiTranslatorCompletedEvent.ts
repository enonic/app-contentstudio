import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class AiTranslatorCompletedEvent
    extends Event {

    readonly path: string;

    readonly text?: string;

    readonly message?: string;

    readonly success: boolean;

    private constructor() {
        super();
    }

    static on(handler: (event: AiTranslatorCompletedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AiTranslatorCompletedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
