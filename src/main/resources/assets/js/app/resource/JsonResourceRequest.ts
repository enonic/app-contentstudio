import ResourceRequest = api.rest.ResourceRequest;
import ContentJson = api.content.json.ContentJson;
import ContentTypeName = api.schema.content.ContentTypeName;
import Content = api.content.Content;
import SiteBuilder = api.content.site.SiteBuilder;
import PageTemplateBuilder = api.content.page.PageTemplateBuilder;
import ContentBuilder = api.content.ContentBuilder;

export class JsonResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequest<JSON_TYPE, PARSED_TYPE> {

    fromJsonToContent(json: ContentJson): Content {
        let type = new ContentTypeName(json.type);

        if (type.isSite()) {
            return new SiteBuilder().fromContentJson(json).build();
        } else if (type.isPageTemplate()) {
            return new PageTemplateBuilder().fromContentJson(json).build();
        }
        return new ContentBuilder().fromContentJson(json).build();
    }
}
