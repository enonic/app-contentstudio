import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class TextEditModeChangedEvent
    extends Event {

    private readonly value: boolean;

    constructor(value: boolean) {
        super();

        this.value = value;
    }

    isEditMode(): boolean {
        return this.value;
    }

    static on(handler: (event: TextEditModeChangedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: TextEditModeChangedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
