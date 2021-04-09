import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeSummaryJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryJson';
import {ProjectBasedResourceRequest} from '../wizard/ProjectBasedResourceRequest';

export abstract class DescriptorResourceRequest<PARSED_TYPE>
    extends ProjectBasedResourceRequest<PARSED_TYPE> {

    constructor() {
        super();
        this.addRequestPathElements('schema', 'filter');
    }

    fromJsonToContentTypeSummary(json: ContentTypeSummaryJson): ContentTypeSummary {
        return ContentTypeSummary.fromJson(json);
    }
}
