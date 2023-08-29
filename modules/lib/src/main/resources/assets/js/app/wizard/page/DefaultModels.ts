import {PageTemplate} from '../../content/PageTemplate';
import {Descriptor} from '../../page/Descriptor';

export class DefaultModels {

    private readonly defaultPageTemplate: PageTemplate;

    constructor(pageTemplate: PageTemplate) {
        this.defaultPageTemplate = pageTemplate;
    }

    hasDefaultPageTemplate(): boolean {
        return !!this.defaultPageTemplate;
    }

    getDefaultPageTemplate(): PageTemplate {
        return this.defaultPageTemplate ? this.defaultPageTemplate.clone() : null;
    }
}
