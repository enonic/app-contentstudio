import '../../api.ts';

export class ContentTreeGridLoadedEvent
    extends api.event.Event {

    static on(handler: (event: ContentTreeGridLoadedEvent) => void) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentTreeGridLoadedEvent) => void) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler);
    }
}
