import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export class TextEditModeChangedEvent
    extends IframeEvent {

    private readonly value: boolean;

    constructor(value: boolean) {
        super();

        this.value = value;
    }

    isEditMode(): boolean {
        return this.value;
    }

    static on(handler: (event: TextEditModeChangedEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: TextEditModeChangedEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
