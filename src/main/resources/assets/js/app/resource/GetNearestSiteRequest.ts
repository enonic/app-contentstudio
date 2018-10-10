import {ContentResourceRequest} from './ContentResourceRequest';
import {Site} from '../content/Site';

export class GetNearestSiteRequest
    extends ContentResourceRequest<api.content.json.ContentJson, Site> {

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

        return this.send().then((response: api.rest.JsonResponse<api.content.json.ContentJson>) => {
            return response.isBlank() ? null : <Site>this.fromJsonToContent(response.getResult());
        });
    }
}
