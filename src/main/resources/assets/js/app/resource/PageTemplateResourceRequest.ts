import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResourceRequest} from './JsonResourceRequest';
import {PageTemplate} from '../content/PageTemplate';
import {ContentJson} from '../content/ContentJson';

export class PageTemplateResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends JsonResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: Path;

    constructor() {
        super();
        this.resourcePath = Path.fromParent(super.getRestPath(), 'content', 'page', 'template');
    }

    getResourcePath(): Path {
        return this.resourcePath;
    }

    fromJsonToContent(json: ContentJson): PageTemplate {
        return <PageTemplate>super.fromJsonToContent(json);
    }
}
