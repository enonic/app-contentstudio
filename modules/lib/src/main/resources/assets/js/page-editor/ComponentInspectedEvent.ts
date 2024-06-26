import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../app/page/region/ComponentPath';

export class ComponentInspectedEvent
    extends Event {

    private readonly path: string;

    constructor(path: ComponentPath) {
        super();
        this.path = path.toString();
    }

    getComponentPathAsString(): string {
        return this.path;
    }

    static on(handler: (event: ComponentInspectedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: ComponentInspectedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
