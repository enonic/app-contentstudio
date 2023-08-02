import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentPath} from '../../app/page/region/ComponentPath';
import {ComponentType} from '../../app/page/region/ComponentType';

export class UpdateTextComponentRequest
    extends Event {

    private readonly path: ComponentPath;

    private readonly text: string;
    constructor(path: ComponentPath, text: string) {
        super();
        this.path = path;
        this.text = text;
    }

    getComponentPath(): ComponentPath {
        return this.path;
    }

    getText(): string {
        return this.text;
    }

    static on(handler: (event: UpdateTextComponentRequest) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: UpdateTextComponentRequest) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
