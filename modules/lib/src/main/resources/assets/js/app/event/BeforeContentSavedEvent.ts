import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export class BeforeContentSavedEvent
    extends IframeEvent {

    static on(handler: (event: BeforeContentSavedEvent) => void) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: BeforeContentSavedEvent) => void) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler);
    }
}
