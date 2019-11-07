import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
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
    }

    getParams(): Object {
        return {
            contentId: this.contentId.toString()
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'nearestSite');
    }

    sendAndParse(): Q.Promise<Site> {

        return this.send().then((response: JsonResponse<ContentJson>) => {
            return response.isBlank() ? null : <Site>this.fromJsonToContent(response.getResult());
        });
    }
}
