import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class GetContentByIdRequest
    extends CmsContentResourceRequest<Content> {

    private id: ContentId;

    private expand: string;

    private versionId: string;

    constructor(id: ContentId) {
        super();
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

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }
}
