import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export class LiveEditPageInitializationErrorEvent
    extends IframeEvent {

    private message: string;

    constructor(message: string) {
        super();
        this.message = message;
    }

    getMessage(): string {
        return this.message;
    }

    static on(handler: (event: LiveEditPageInitializationErrorEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: LiveEditPageInitializationErrorEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
