import {PageTemplateResourceRequest} from '../../../../../resource/PageTemplateResourceRequest';
import {ListContentResult} from '../../../../../resource/ListContentResult';
import {PageTemplate} from '../../../../../content/PageTemplate';
import {ContentJson} from '../../../../../content/ContentJson';

export class PageTemplateLoader
    extends api.util.loader.BaseLoader<ListContentResult<ContentJson>, PageTemplate> {

    constructor(request: PageTemplateResourceRequest<ListContentResult<ContentJson>, PageTemplate[]>) {
        super(request);
    }

    filterFn(template: PageTemplate) {
        return template.getDisplayName().toString().indexOf(this.getSearchString().toLowerCase()) !== -1;
    }

}
