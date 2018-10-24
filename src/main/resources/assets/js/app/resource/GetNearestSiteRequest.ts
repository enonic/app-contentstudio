import {ContentResourceRequest} from './ContentResourceRequest';
import {Site} from '../content/Site';
import {ContentJson} from '../content/ContentJson';

export class GetNearestSiteRequest
    extends ContentResourceRequest<ContentJson, Site> {

    private contentId: api.content.ContentId;

    constructor(contentId: api.content.ContentId) {
        super();
        super.setMethod('POST');
        this.contentId = contentId;
    }

    getParams(): Object {
        return {
            contentId: this.contentId.toString()
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'nearestSite');
    }

    sendAndParse(): wemQ.Promise<Site> {

        return this.send().then((response: api.rest.JsonResponse<ContentJson>) => {
            return response.isBlank() ? null : <Site>this.fromJsonToContent(response.getResult());
        });
    }
}
