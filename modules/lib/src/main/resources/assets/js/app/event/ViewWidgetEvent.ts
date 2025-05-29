import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';

export class ViewWidgetEvent
    extends Event {

    private readonly widget: Widget;

    constructor(widget: Widget) {
        super();
        this.widget = widget;
    }

    public getWidget(): Widget {
        return this.widget;
    }

    static on(handler: (event: ViewWidgetEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ViewWidgetEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
