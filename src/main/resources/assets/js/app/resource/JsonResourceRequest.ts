import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {Content, ContentBuilder} from '../content/Content';
import {SiteBuilder} from '../content/Site';
import {PageTemplateBuilder} from '../content/PageTemplate';
import {ContentJson} from '../content/ContentJson';

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
