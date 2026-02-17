import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {type ContentTypeSummaryListJson} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummaryListJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {SchemaFilterBasedRequest} from './SchemaFilterBasedRequest';

interface GetContentTypeDescriptorsRequestParams {contentId: string, allowedContentTypes?: string[]}

export class GetContentTypeDescriptorsRequest
    extends SchemaFilterBasedRequest<ContentTypeSummary> {

    private allowedContentTypes: string[];

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('contentTypes');
    }

    getParams(): object {
        const params = super.getParams() as GetContentTypeDescriptorsRequestParams;
        params.allowedContentTypes = this.allowedContentTypes;

        return params;
    }

    setAllowedContentTypes(types: string[]): GetContentTypeDescriptorsRequest {
        this.allowedContentTypes = types;
        return this;
    }

    protected parseResponse(response: JsonResponse<ContentTypeSummaryListJson>): ContentTypeSummary[] {
        return response.getResult().contentTypes.map((json) => ContentTypeSummary.fromJson(json));
    }
}
