import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export class SkipLiveEditReloadConfirmationEvent
    extends IframeEvent {

    private skip: boolean;

    constructor(skip: boolean) {
        super();
        this.skip = skip;
    }

    isSkip(): boolean {
        return this.skip;
    }

    static on(handler: (event: SkipLiveEditReloadConfirmationEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SkipLiveEditReloadConfirmationEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
