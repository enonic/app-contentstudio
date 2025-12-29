import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export class CreateOrDestroyDraggableEvent
    extends IframeEvent {

    private readonly hash: string | number;

    private readonly create: boolean;

    constructor(hash: string | number, create: boolean) {
        super();

        this.hash = hash;
        this.create = create;
    }

    isCreate(): boolean {
        return this.create;
    }

    getHash(): string | number {
        return this.hash;
    }

    static on(handler: (event: CreateOrDestroyDraggableEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: CreateOrDestroyDraggableEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
