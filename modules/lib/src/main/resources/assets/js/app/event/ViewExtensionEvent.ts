import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type Extension} from '@enonic/lib-admin-ui/extension/Extension';

export class ViewExtensionEvent
    extends Event {

    private readonly extension: Extension;

    constructor(widget: Extension) {
        super();
        this.extension = widget;
    }

    public getExtension(): Extension {
        return this.extension;
    }

    static on(handler: (event: ViewExtensionEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ViewExtensionEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
