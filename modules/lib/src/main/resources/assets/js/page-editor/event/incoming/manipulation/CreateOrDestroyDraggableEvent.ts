import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export class CreateOrDestroyDraggableEvent
    extends IframeEvent {

    private readonly type: string;

    private readonly create: boolean;

    constructor(type: string, create: boolean) {
        super();

        this.type = type;
        this.create = create;
    }

    isCreate(): boolean {
        return this.create;
    }

    getType(): string {
        return this.type;
    }

    static on(handler: (event: CreateOrDestroyDraggableEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: CreateOrDestroyDraggableEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
