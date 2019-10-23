import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentsExistByPathJson} from './json/ContentsExistByPathJson';
import {ContentsExistByPathResult} from './ContentsExistByPathResult';

export class ContentsExistByPathRequest
    extends ContentResourceRequest<ContentsExistByPathJson, ContentsExistByPathResult> {

    private contentPaths: string[] = [];

    constructor(contentPaths: string[]) {
        super();
        super.setMethod('POST');
        this.contentPaths = contentPaths;
    }

    getParams(): Object {
        return {
            contentPaths: this.contentPaths
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'contentsExistByPath');
    }

    sendAndParse(): Q.Promise<ContentsExistByPathResult> {

        return this.send().then((response: JsonResponse<ContentsExistByPathJson>) => {
            return new ContentsExistByPathResult(response.getResult());
        });
    }
}
