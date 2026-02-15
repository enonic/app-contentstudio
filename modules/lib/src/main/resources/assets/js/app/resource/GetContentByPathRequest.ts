import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type Content} from '../content/Content';
import {type ContentJson} from '../content/ContentJson';
import {type ContentPath} from '../content/ContentPath';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class GetContentByPathRequest
    extends CmsContentResourceRequest<Content> {

    private contentPath: ContentPath;

    constructor(path: ContentPath) {
        super();
        this.contentPath = path;
        this.addRequestPathElements('bypath');
    }

    getParams(): object {
        return {
            path: this.contentPath.toString()
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }
}
