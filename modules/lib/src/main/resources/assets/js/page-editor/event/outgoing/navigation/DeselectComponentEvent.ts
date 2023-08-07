import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ItemView} from '../../../ItemView';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';

export class DeselectComponentEvent
    extends Event {

    private readonly path: ComponentPath;

    constructor(path: ComponentPath) {
        super();
        this.path = path;
    }

    getPath(): ComponentPath {
        return this.path;
    }

    static on(handler: (event: DeselectComponentEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: DeselectComponentEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
