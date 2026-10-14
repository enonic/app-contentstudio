import { Event } from '@enonic/lib-admin-ui/event/Event';
import { ClassHelper } from '@enonic/lib-admin-ui/ClassHelper';
import { Content } from '../content/Content';

export class ContentSettingsUpdatedEvent extends Event {
    private readonly content: Content;

    constructor(content: Content) {
        super();

        this.content = content;
    }

    public getContent(): Content {
        return this.content;
    }

    static on(handler: (event: ContentSettingsUpdatedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentSettingsUpdatedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
