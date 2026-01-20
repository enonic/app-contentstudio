import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export class LoadComponentFailedEvent
    extends IframeEvent {

    private readonly path: ComponentPath;

    private readonly error: Error;

    constructor(path: ComponentPath, error: Error) {
        super();
        this.path = path;
        this.error = error;
    }

    getComponentPath(): ComponentPath {
        return this.path;
    }

    getError(): unknown {
        return this.error;
    }

    toString(): string {
        return `${this.path.toString()}:${this.error.message}`;
    }

    static fromString(value: string): LoadComponentFailedEvent {
        // doing from/toString to serialize Error manually, because of Error stack having circular structure
        const separatorIndex = value.indexOf(':');
        const pathStr = separatorIndex === -1 ? value : value.substring(0, separatorIndex);
        const errorMessage = separatorIndex === -1 ? undefined : value.substring(separatorIndex + 1);
        return new LoadComponentFailedEvent(ComponentPath.fromString(pathStr), new Error(errorMessage));
    }

    static on(handler: (event: LoadComponentFailedEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: LoadComponentFailedEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
