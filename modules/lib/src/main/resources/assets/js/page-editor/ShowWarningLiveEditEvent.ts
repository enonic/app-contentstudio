import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class ShowWarningLiveEditEvent
    extends Event {

    private message: string;

    constructor(message: string) {
        super();

        this.message = message;
    }

    getMessage(): string {
        return this.message;
    }

    static on(handler: (event: ShowWarningLiveEditEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ShowWarningLiveEditEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }

}
