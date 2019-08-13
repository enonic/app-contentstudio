import {JsonResourceRequest} from './JsonResourceRequest';
import {PageTemplate} from '../content/PageTemplate';
import {ContentJson} from '../content/ContentJson';

export class PageTemplateResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends JsonResourceRequest<JSON_TYPE, PARSED_TYPE> {

    getResourcePath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'page', 'template');
    }

    fromJsonToContent(json: ContentJson): PageTemplate {
        return <PageTemplate>super.fromJsonToContent(json);
    }
}
