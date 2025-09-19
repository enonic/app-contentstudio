import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {WizardPanel} from '@enonic/lib-admin-ui/app/wizard/WizardPanel';
import {Content} from '../content/Content';

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
