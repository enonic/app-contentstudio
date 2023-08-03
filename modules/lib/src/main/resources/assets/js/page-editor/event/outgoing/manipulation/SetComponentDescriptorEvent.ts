import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';

export class SetComponentDescriptorEvent
    extends Event {

    private readonly descriptor: string;

    private readonly path: ComponentPath;
    constructor(path: ComponentPath, descriptor: string) {
        super();

        this.descriptor = descriptor;
        this.path = path;
    }

    getDescriptor(): string {
        return this.descriptor;
    }

    getComponentPath(): ComponentPath {
        return this.path;
    }

    static on(handler: (event: SetComponentDescriptorEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SetComponentDescriptorEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
