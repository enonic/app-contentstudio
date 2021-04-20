import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeSummaryListJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryListJson';
import {SchemaFilterBasedRequest} from './SchemaFilterBasedRequest';

export class GetContentTypeDescriptorsRequest
    extends SchemaFilterBasedRequest<ContentTypeSummary> {

    getPostfixPathElement(): string {
        return 'contentTypes';
    }

    protected parseResponse(response: JsonResponse<ContentTypeSummaryListJson>): ContentTypeSummary[] {
        return response.getResult().contentTypes.map((json) => ContentTypeSummary.fromJson(json));
    }
}
