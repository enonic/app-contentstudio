import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class AiTranslatorAllCompletedEvent
    extends Event {

    readonly success: boolean;

    readonly message?: string;

    private constructor() {
        super();
    }

    static on(handler: (event: AiTranslatorAllCompletedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AiTranslatorAllCompletedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
