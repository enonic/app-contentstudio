import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';

export class SetComponentDescriptorEvent
    extends IframeEvent {

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
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SetComponentDescriptorEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
