import {PageTemplate} from '../../content/PageTemplate';
import {Descriptor} from '../../page/Descriptor';

export class DefaultModels {

    private defaultPageTemplate: PageTemplate;

    private defaultPageTemplateDescriptor: Descriptor;

    constructor(pageTemplate: PageTemplate, pageDescriptor: Descriptor) {
        this.defaultPageTemplate = pageTemplate;
        this.defaultPageTemplateDescriptor = pageDescriptor;
    }

    hasDefaultPageTemplate(): boolean {
        return !!this.defaultPageTemplate;
    }

    getDefaultPageTemplate(): PageTemplate {
        return this.defaultPageTemplate ? this.defaultPageTemplate.clone() : null;
    }

    getDefaultPageTemplateDescriptor(): Descriptor {
        return this.defaultPageTemplateDescriptor;
    }
}
