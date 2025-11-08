import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';
import {ComponentTextUpdatedOrigin} from '../../../../app/page/region/ComponentTextUpdatedOrigin';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';


// TODO: will probably fail, because receiver expects UpdateTextComponentViewEvent, but will get an Object
export class UpdateTextComponentViewEvent
    extends IframeEvent {

    private readonly path: ComponentPath;

    private readonly text: string;

    private readonly origin: ComponentTextUpdatedOrigin;

    constructor(path: ComponentPath, text: string, origin?: ComponentTextUpdatedOrigin) {
        super();
        this.path = path;
        this.text = text;
        this.origin = origin || 'unknown';
    }

    getComponentPath(): ComponentPath {
        return this.path;
    }

    getText(): string {
        return this.text;
    }

    getOrigin(): ComponentTextUpdatedOrigin {
        return this.origin;
    }

    static on(handler: (event: UpdateTextComponentViewEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: UpdateTextComponentViewEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
