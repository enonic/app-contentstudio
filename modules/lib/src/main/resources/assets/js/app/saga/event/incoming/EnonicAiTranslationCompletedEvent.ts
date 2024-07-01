import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class EnonicAiTranslationCompletedEvent
    extends Event {

    readonly path: string;

    readonly value: string;

    private constructor() {
        super();
    }

    static on(handler: (event: EnonicAiTranslationCompletedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiTranslationCompletedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
