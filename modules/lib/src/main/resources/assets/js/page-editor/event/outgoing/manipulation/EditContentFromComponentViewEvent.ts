import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export class EditContentFromComponentViewEvent
    extends IframeEvent {

    private readonly id: string;
    constructor(id: string) {
        super();

        this.id = id;
    }

    getId(): string {
        return this.id;
    }

    static on(handler: (event: EditContentFromComponentViewEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: EditContentFromComponentViewEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
