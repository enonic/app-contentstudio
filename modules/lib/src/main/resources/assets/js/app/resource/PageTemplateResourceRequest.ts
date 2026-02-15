import {type PageTemplate} from '../content/PageTemplate';
import {type ContentJson} from '../content/ContentJson';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export abstract class PageTemplateResourceRequest<PARSED_TYPE>
    extends CmsContentResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('page', 'template');
    }

    fromJsonToContent(json: ContentJson): PageTemplate {
        return super.fromJsonToContent(json) as PageTemplate;
    }
}
