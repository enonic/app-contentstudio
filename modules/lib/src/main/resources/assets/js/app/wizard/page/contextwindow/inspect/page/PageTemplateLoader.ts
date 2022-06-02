import {PageTemplateResourceRequest} from '../../../../../resource/PageTemplateResourceRequest';
import {PageTemplate} from '../../../../../content/PageTemplate';
import {BaseLoader} from '@enonic/lib-admin-ui/util/loader/BaseLoader';

export class PageTemplateLoader
    extends BaseLoader<PageTemplate> {

    constructor(request: PageTemplateResourceRequest<PageTemplate[]>) {
        super(request);
    }

    filterFn(template: PageTemplate) {
        return template.getDisplayName().toString().indexOf(this.getSearchString().toLowerCase()) !== -1;
    }

}
