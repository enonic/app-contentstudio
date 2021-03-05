import {PageTemplate} from '../content/PageTemplate';
import {ContentJson} from '../content/ContentJson';
import {ContentResourceRequest} from './ContentResourceRequest';

export abstract class PageTemplateResourceRequest<PARSED_TYPE>
    extends ContentResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('page', 'template');
    }

    fromJsonToContent(json: ContentJson): PageTemplate {
        return <PageTemplate>super.fromJsonToContent(json);
    }
}
