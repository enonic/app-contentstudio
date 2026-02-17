import {type PageTemplateKey} from '../PageTemplateKey';
import {PageUpdatedEvent} from './PageUpdatedEvent';

export class PageTemplateUpdatedEvent extends PageUpdatedEvent {

    private readonly newValue: PageTemplateKey;
    private readonly oldValue?: PageTemplateKey;

    constructor(newValue: PageTemplateKey, oldValue?: PageTemplateKey) {
        super();

        this.newValue = newValue;
        this.oldValue = oldValue;
    }

    getPageTemplate(): PageTemplateKey {
        return this.newValue;
    }

    getOldPageTemplate(): PageTemplateKey {
        return this.oldValue;
    }
}

