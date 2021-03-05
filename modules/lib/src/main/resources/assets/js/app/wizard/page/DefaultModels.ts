import {PageDescriptor} from 'lib-admin-ui/content/page/PageDescriptor';
import {PageTemplate} from '../../content/PageTemplate';

export class DefaultModels {

    private pageTemplate: PageTemplate;

    private pageDescriptor: PageDescriptor;

    constructor(pageTemplate: PageTemplate, pageDescriptor: PageDescriptor) {
        this.pageTemplate = pageTemplate;
        this.pageDescriptor = pageDescriptor;
    }

    hasPageTemplate(): boolean {
        return !!this.pageTemplate;
    }

    getPageTemplate(): PageTemplate {
        return this.pageTemplate ? this.pageTemplate.clone() : null;
    }

    getPageDescriptor(): PageDescriptor {
        return this.pageDescriptor;
    }
}
