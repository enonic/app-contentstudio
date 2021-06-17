import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {ContentPath} from '../content/ContentPath';

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
