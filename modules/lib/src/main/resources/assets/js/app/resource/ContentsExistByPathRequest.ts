import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type ContentsExistByPathJson} from './json/ContentsExistByPathJson';
import {ContentsExistByPathResult} from './ContentsExistByPathResult';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class ContentsExistByPathRequest
    extends CmsContentResourceRequest<ContentsExistByPathResult> {

    private contentPaths: string[] = [];

    constructor(contentPaths: string[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.contentPaths = contentPaths;
        this.addRequestPathElements('contentsExistByPath');
    }

    getParams(): object {
        return {
            contentPaths: this.contentPaths
        };
    }

    protected parseResponse(response: JsonResponse<ContentsExistByPathJson>): ContentsExistByPathResult {
        return new ContentsExistByPathResult(response.getResult());
    }
}
