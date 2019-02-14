export class InspectEvent
    extends api.event.Event {

    private showPanel: boolean;

    constructor(showPanel: boolean = true, name?: string) {
        super(name);
        this.showPanel = showPanel;
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
