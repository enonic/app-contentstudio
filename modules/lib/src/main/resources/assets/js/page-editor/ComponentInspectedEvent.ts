import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../app/page/region/ComponentPath';

export class ComponentInspectedEvent
    extends IframeEvent {

    private readonly path: string;

    constructor(path: ComponentPath) {
        super();
        this.path = path.toString();
    }

    getComponentPathAsString(): string {
        return this.path;
    }

    static on(handler: (event: ComponentInspectedEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: ComponentInspectedEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    public static fromObject(o: object): ComponentInspectedEvent {
        if (o instanceof ComponentInspectedEvent) {
            return o;
        } else {
            return new ComponentInspectedEvent(
                ComponentPath.fromString(o['path'])
            );
        }
    }
}
