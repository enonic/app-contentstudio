import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {SchemaFilterBasedRequest} from './SchemaFilterBasedRequest';
import {ContentTypeSummaryListJson} from '../content/ContentTypeSummaryListJson';

export class GetContentTypeDescriptorsRequest
    extends SchemaFilterBasedRequest<ContentTypeSummary> {

    constructor() {
        super();
        this.addRequestPathElements('contentTypes');
    }

    protected parseResponse(response: JsonResponse<ContentTypeSummaryListJson>): ContentTypeSummary[] {
        return response.getResult().contentTypes.map((json) => ContentTypeSummary.fromJson(json));
    }
}
