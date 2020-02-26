import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';

export class GetContentByPathRequest
    extends ContentResourceRequest<ContentJson, Content> {

    private contentPath: ContentPath;

    constructor(path: ContentPath) {
        super();
        super.setMethod('GET');
        this.contentPath = path;
    }

    getParams(): Object {
        return {
            path: this.contentPath.toString()
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'bypath');
    }

    sendAndParse(): Q.Promise<Content> {

        return this.send().then((response: JsonResponse<ContentJson>) => {
            return this.fromJsonToContent(response.getResult());
        });
    }
}
