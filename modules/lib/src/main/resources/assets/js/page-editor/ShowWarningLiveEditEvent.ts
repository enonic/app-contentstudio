import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class ShowWarningLiveEditEvent
    extends IframeEvent {

    private message: string;

    constructor(message: string) {
        super();

        this.message = message;
    }

    getMessage(): string {
        return this.message;
    }

    static on(handler: (event: ShowWarningLiveEditEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ShowWarningLiveEditEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }

}
