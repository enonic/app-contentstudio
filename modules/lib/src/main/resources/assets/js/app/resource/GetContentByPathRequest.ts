import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';

export class GetContentByPathRequest
    extends ContentResourceRequest<Content> {

    private contentPath: ContentPath;

    constructor(path: ContentPath) {
        super();
        this.contentPath = path;
        this.addRequestPathElements('bypath');
    }

    getParams(): Object {
        return {
            path: this.contentPath.toString()
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }
}
