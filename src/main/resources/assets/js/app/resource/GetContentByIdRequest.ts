import ContentId = api.content.ContentId;
import {ContentResourceRequest} from './ContentResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';

export class GetContentByIdRequest
    extends ContentResourceRequest<ContentJson, Content> {

    private id: ContentId;

    private expand: string;

    private versionId: string;

    constructor(id: ContentId) {
        super();
        super.setMethod('GET');
        this.id = id;
    }

    public setExpand(expand: string): GetContentByIdRequest {
        this.expand = expand;
        return this;
    }

    public setVersion(version: string): GetContentByIdRequest {
        this.versionId = version;
        return this;
    }

    getParams(): Object {
        return {
            id: this.id.toString(),
            versionId: this.versionId,
            expand: this.expand
        };
    }

    getRequestPath(): api.rest.Path {
        return super.getResourcePath();
    }

    sendAndParse(): wemQ.Promise<Content> {

        return this.send().then((response: api.rest.JsonResponse<ContentJson>) => {
            return this.fromJsonToContent(response.getResult());
        });
    }
}
