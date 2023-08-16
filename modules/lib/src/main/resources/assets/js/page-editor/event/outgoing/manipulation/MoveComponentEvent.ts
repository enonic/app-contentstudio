import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';

export class MoveComponentEvent
    extends Event {

    private readonly from: ComponentPath;
    private readonly to: ComponentPath;

    constructor(from: ComponentPath, to: ComponentPath) {
        super();

        this.from = from;
        this.to = to;
    }

    getFrom(): ComponentPath {
        return this.from;
    }

    getTo(): ComponentPath {
        return this.to;
    }

    static on(handler: (event: MoveComponentEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: MoveComponentEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
