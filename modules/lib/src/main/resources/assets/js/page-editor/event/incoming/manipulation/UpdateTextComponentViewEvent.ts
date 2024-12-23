import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';
import {ComponentTextUpdatedOrigin} from '../../../../app/page/region/ComponentTextUpdatedOrigin';

export class UpdateTextComponentViewEvent
    extends Event {

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
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: UpdateTextComponentViewEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
