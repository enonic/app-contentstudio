import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class AiTranslatorDialogShownEvent
    extends Event {

    private constructor() {
        super();
    }

    static on(handler: (event: AiTranslatorDialogShownEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AiTranslatorDialogShownEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
