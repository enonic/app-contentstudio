import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentsExistByPathJson} from './json/ContentsExistByPathJson';
import {ContentsExistByPathResult} from './ContentsExistByPathResult';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class ContentsExistByPathRequest
    extends ContentResourceRequest<ContentsExistByPathResult> {

    private contentPaths: string[] = [];

    constructor(contentPaths: string[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.contentPaths = contentPaths;
        this.addRequestPathElements('contentsExistByPath');
    }

    getParams(): Object {
        return {
            contentPaths: this.contentPaths
        };
    }

    protected parseResponse(response: JsonResponse<ContentsExistByPathJson>): ContentsExistByPathResult {
        return new ContentsExistByPathResult(response.getResult());
    }
}
