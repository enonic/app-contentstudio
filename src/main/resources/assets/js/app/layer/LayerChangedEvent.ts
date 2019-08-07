export class LayerChangedEvent
    extends api.event.Event {

    static on(handler: (event: LayerChangedEvent) => void) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: LayerChangedEvent) => void) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler);
    }
}
