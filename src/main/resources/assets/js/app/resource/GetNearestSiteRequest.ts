import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {Site} from '../content/Site';
import {ContentJson} from '../content/ContentJson';

export class GetNearestSiteRequest
    extends ContentResourceRequest<ContentJson, Site> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        super.setMethod('POST');
        this.contentId = contentId;
        this.addRequestPathElements('nearestSite');
    }

    getParams(): Object {
        return {
            contentId: this.contentId.toString()
        };
    }

    protected processResponse(response: JsonResponse<ContentJson>): Site {
        return response.isBlank() ? null : <Site>this.fromJsonToContent(response.getResult());
    }

}
