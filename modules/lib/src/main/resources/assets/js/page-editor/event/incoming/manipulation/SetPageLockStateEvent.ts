import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

// TODO: will probably fail, because receiver expects SetPageLockStateEvent, but will get an Object
export class SetPageLockStateEvent
    extends IframeEvent {

    private readonly lock: boolean;

    constructor(lock: boolean) {
        super();

        this.lock = lock;
    }

    isToLock(): boolean {
        return this.lock;
    }

    static on(handler: (event: SetPageLockStateEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SetPageLockStateEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
