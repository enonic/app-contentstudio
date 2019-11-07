import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentsExistResult} from './ContentsExistResult';
import {ContentsExistJson} from './json/ContentsExistJson';

export class ContentsExistRequest
    extends ContentResourceRequest<ContentsExistJson, ContentsExistResult> {

    private contentIds: string[] = [];

    constructor(contentIds: string[]) {
        super();
        super.setMethod('POST');
        this.contentIds = contentIds;
    }

    getParams(): Object {
        return {
            contentIds: this.contentIds
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'contentsExist');
    }

    sendAndParse(): Q.Promise<ContentsExistResult> {

        return this.send().then((response: JsonResponse<ContentsExistJson>) => {
            return new ContentsExistResult(response.getResult());
        });
    }
}
