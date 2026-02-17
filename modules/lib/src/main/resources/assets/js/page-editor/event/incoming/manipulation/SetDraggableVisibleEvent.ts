import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export class SetDraggableVisibleEvent
    extends IframeEvent {

    private readonly type: string;

    private readonly visible: boolean;

    constructor(type: string, visible: boolean) {
        super();

        this.type = type;
        this.visible = visible;
    }

    isVisible(): boolean {
        return this.visible;
    }

    getType(): string {
        return this.type;
    }

    static on(handler: (event: SetDraggableVisibleEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SetDraggableVisibleEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
