import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class EnonicAiTranslationStartedEvent
    extends Event {

    readonly path: string;

    private constructor() {
        super();
    }

    static on(handler: (event: EnonicAiTranslationStartedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EnonicAiTranslationStartedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
