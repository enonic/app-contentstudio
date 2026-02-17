import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class ContentLanguageUpdatedEvent
    extends Event {

    private readonly language: string;

    constructor(language: string) {
        super();

        this.language = language;
    }

    public getLanguage(): string {
        return this.language;
    }

    static on(handler: (event: ContentLanguageUpdatedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentLanguageUpdatedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
