import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class InspectEvent
    extends Event {

    private readonly showWidget: boolean;

    private readonly showPanel: boolean;

    constructor(showWidget: boolean, showPanel: boolean) {
        super();
        this.showWidget = showWidget;
        this.showPanel = showPanel;
    }

    isShowWidget(): boolean {
        return this.showWidget;
    }

    isShowPanel(): boolean {
        return this.showPanel;
    }

    static on(handler: (event: InspectEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: InspectEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
