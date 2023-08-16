import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class SetPageLockStateEvent
    extends Event {

    private readonly lock: boolean;

    constructor(lock: boolean) {
        super();

        this.lock = lock;
    }

    isToLock(): boolean {
        return this.lock;
    }

    static on(handler: (event: SetPageLockStateEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SetPageLockStateEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
