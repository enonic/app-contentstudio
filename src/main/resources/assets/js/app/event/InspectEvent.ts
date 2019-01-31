export class InspectEvent
    extends api.event.Event {

    static on(handler: (event: InspectEvent) => void) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: InspectEvent) => void) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler);
    }

}
