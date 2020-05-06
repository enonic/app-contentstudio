import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {Site} from '../content/Site';
import {ContentJson} from '../content/ContentJson';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class GetNearestSiteRequest
    extends ContentResourceRequest<Site> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        this.setMethod(HttpMethod.POST);
        this.contentId = contentId;
        this.addRequestPathElements('nearestSite');
    }

    getParams(): Object {
        return {
            contentId: this.contentId.toString()
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Site {
        return response.isBlank() ? null : <Site>this.fromJsonToContent(response.getResult());
    }

}
