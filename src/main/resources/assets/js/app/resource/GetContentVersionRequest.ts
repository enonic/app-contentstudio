import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';

declare var CONFIG;

export class GetContentVersionRequest
    extends ContentResourceRequest<Content> {

    private id: ContentId;

    private versionId: string;

    constructor(id: ContentId) {
        super();
        this.id = id;
    }

    public setVersion(version: string): GetContentVersionRequest {
        this.versionId = version;
        return this;
    }

    getParams(): Object {
        return {
            contentId: this.id.toString(),
            versionId: this.versionId
        };
    }

    getRequestPath(): Path {
        return CONFIG.services.contentUrl;
    }

    sendRequest(): Q.Promise<ContentJson> {

        return this.send().then((response: JsonResponse<ContentJson>) => {
            return response.getResult();
        });
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }
}
