export class InspectEvent
    extends api.event.Event {

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
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: InspectEvent) => void) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler);
    }

}
