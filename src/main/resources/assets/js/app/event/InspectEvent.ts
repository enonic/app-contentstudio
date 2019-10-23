import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';

export class InspectEvent
    extends Event {

    private showWidget: boolean;

    private showPanel: boolean;

    constructor(showWidget: boolean, showPanel: boolean, name?: string) {
        super(name);
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
