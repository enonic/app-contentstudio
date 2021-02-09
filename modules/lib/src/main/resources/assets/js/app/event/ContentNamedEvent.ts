import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {WizardPanel} from 'lib-admin-ui/app/wizard/WizardPanel';
import {Content} from '../content/Content';

export class ContentNamedEvent
    extends Event {

    private wizard: WizardPanel<Content>;

    private content: Content;

    constructor(wizard: WizardPanel<Content>, content: Content) {
        super();
        this.wizard = wizard;
        this.content = content;
    }

    public getWizard(): WizardPanel<Content> {
        return this.wizard;
    }

    public getContent(): Content {
        return this.content;
    }

    static on(handler: (event: ContentNamedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentNamedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
