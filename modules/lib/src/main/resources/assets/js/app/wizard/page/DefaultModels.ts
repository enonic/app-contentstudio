import {PageTemplate} from '../../content/PageTemplate';
import {Descriptor} from '../../page/Descriptor';

export class DefaultModels {

    private pageTemplate: PageTemplate;

    private pageDescriptor: Descriptor;

    constructor(pageTemplate: PageTemplate, pageDescriptor: Descriptor) {
        this.pageTemplate = pageTemplate;
        this.pageDescriptor = pageDescriptor;
    }

    hasPageTemplate(): boolean {
        return !!this.pageTemplate;
    }

    getPageTemplate(): PageTemplate {
        return this.pageTemplate ? this.pageTemplate.clone() : null;
    }

    getPageDescriptor(): Descriptor {
        return this.pageDescriptor;
    }
}
