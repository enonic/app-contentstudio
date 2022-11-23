import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeSummaryListJson} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummaryListJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {SchemaFilterBasedRequest} from './SchemaFilterBasedRequest';

export class GetContentTypeDescriptorsRequest
    extends SchemaFilterBasedRequest<ContentTypeSummary> {

    private allowedContentTypes: string[];

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('contentTypes');
    }

    getParams(): Object {
        const params = <any>super.getParams();
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
