import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

// TODO: will probably fail, because receiver expects SetModifyAllowedEvent, but will get an Object
export class SetModifyAllowedEvent
    extends IframeEvent {

    private readonly canModify: boolean;

    constructor(canModify: boolean) {
        super();

        this.canModify = canModify;
    }

    isModifyAllowed(): boolean {
        return this.canModify;
    }

    static on(handler: (event: SetModifyAllowedEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SetModifyAllowedEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
