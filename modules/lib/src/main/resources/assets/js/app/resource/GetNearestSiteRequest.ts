import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {Site} from '../content/Site';
import {ContentJson} from '../content/ContentJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class GetNearestSiteRequest
    extends CmsContentResourceRequest<Site> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        this.setMethod(HttpMethod.POST);
        this.contentId = contentId;
        this.addRequestPathElements('nearestSite');
    }

    getParams(): object {
        return {
            contentId: this.contentId.toString()
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Site {
        return response.isBlank() ? null : this.fromJsonToContent(response.getResult()) as Site;
    }

}
