import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeSummaryListJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryListJson';
import {ProjectBasedResourceRequest} from '../wizard/ProjectBasedResourceRequest';

export class GetContentTypeDescriptorsRequest
    extends ProjectBasedResourceRequest<ContentTypeSummary[]> {

    private contentId: ContentId;

    constructor() {
        super();
        this.addRequestPathElements('contentTypes');
    }

    getParams(): Object {
        return {
            contentId: this.contentId?.toString()
        };
    }

    setContentId(contentId: ContentId): GetContentTypeDescriptorsRequest {
        this.contentId = contentId;
        return this;
    }

    protected parseResponse(response: JsonResponse<ContentTypeSummaryListJson>): ContentTypeSummary[] {
        return response.getResult().contentTypes.map((json) => ContentTypeSummary.fromJson(json));
    }
}
