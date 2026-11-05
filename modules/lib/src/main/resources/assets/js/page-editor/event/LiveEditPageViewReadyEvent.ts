import { ClassHelper } from '@enonic/lib-admin-ui/ClassHelper';
import { IframeEvent } from '@enonic/lib-admin-ui/event/IframeEvent';

export class LiveEditPageViewReadyEvent extends IframeEvent {
    private readonly inlineEditing?: boolean;

    constructor(inlineEditing?: boolean) {
        super();
        this.inlineEditing = inlineEditing;
    }

    // Undefined when the page editor predates the `ready.inlineEditing` field.
    getInlineEditing(): boolean | undefined {
        return this.inlineEditing;
    }

    static on(handler: (event: LiveEditPageViewReadyEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: LiveEditPageViewReadyEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
