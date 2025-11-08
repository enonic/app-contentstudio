import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ComponentView} from './ComponentView';
import {ComponentPath} from '../app/page/region/ComponentPath';

// TODO: will probably fail, because receiver expects ComponentLoadedEvent, but will get an Object
export class ComponentLoadedEvent
    extends IframeEvent {

    private readonly newComponentView: ComponentView;

    constructor(newComponentView: ComponentView) {
        super();
        this.newComponentView = newComponentView;
    }

    getNewComponentView(): ComponentView {
        return this.newComponentView;
    }

    getPath(): ComponentPath {
        return this.newComponentView.getPath();
    }

    static on(handler: (event: ComponentLoadedEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ComponentLoadedEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
