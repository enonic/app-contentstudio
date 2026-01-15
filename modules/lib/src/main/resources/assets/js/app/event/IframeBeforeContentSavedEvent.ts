import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {BeforeContentSavedEvent} from './BeforeContentSavedEvent';

export class IframeBeforeContentSavedEvent
    extends IframeEvent {

    static on(handler: (event: BeforeContentSavedEvent) => void) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: BeforeContentSavedEvent) => void) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler);
    }
}
