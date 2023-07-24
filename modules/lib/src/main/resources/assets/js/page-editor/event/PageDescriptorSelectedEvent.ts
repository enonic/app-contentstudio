import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class PageDescriptorSelectedEvent
    extends Event {

    private readonly descriptor: string;
    constructor(descriptor: string) {
        super();

        this.descriptor = descriptor;
    }

    getDescriptor(): string {
        return this.descriptor;
    }

    static on(handler: (event: PageDescriptorSelectedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: PageDescriptorSelectedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
