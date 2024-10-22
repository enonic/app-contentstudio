import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class AiTranslatorOpenDialogEvent
    extends Event {

    static on(handler: (event: AiTranslatorOpenDialogEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AiTranslatorOpenDialogEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
