import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class AiTranslatorNoLicenseEvent
    extends Event {

    private constructor() {
        super();
    }

    static on(handler: (event: AiTranslatorNoLicenseEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: AiTranslatorNoLicenseEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
