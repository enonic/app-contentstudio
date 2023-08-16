import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class SetModifyAllowedEvent
    extends Event {

    private readonly canModify: boolean;

    constructor(canModify: boolean) {
        super();

        this.canModify = canModify;
    }

    isModifyAllowed(): boolean {
        return this.canModify;
    }

    static on(handler: (event: SetModifyAllowedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SetModifyAllowedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
