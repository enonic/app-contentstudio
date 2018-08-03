import ContentJson = api.content.json.ContentJson;
import ListContentResult = api.content.resource.result.ListContentResult;
import PageTemplate = api.content.page.PageTemplate;
import PageTemplateResourceRequest = api.content.page.PageTemplateResourceRequest;

export class PageTemplateLoader
    extends api.util.loader.BaseLoader<ListContentResult<ContentJson>, PageTemplate> {

    constructor(request: PageTemplateResourceRequest<ListContentResult<ContentJson>, PageTemplate[]>) {
        super(request);
    }

    filterFn(template: PageTemplate) {
        return template.getDisplayName().toString().indexOf(this.getSearchString().toLowerCase()) !== -1;
    }

}
