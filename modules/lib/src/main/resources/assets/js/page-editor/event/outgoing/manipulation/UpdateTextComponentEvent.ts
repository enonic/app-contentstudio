import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ComponentPath} from '../../../../app/page/region/ComponentPath';
import type {ComponentTextUpdatedOrigin} from '../../../../app/page/region/ComponentTextUpdatedOrigin';

export class UpdateTextComponentEvent
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

    static on(handler: (event: UpdateTextComponentEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: UpdateTextComponentEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
