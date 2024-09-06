import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentsExistResult} from './ContentsExistResult';
import {ContentsExistJson} from './json/ContentsExistJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class ContentsExistRequest
    extends CmsContentResourceRequest<ContentsExistResult> {

    private contentIds: string[] = [];

    constructor(contentIds: string[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.contentIds = contentIds;
        this.addRequestPathElements('contentsExist');
    }

    getParams(): object {
        return {
            contentIds: this.contentIds
        };
    }

    protected parseResponse(response: JsonResponse<ContentsExistJson>): ContentsExistResult {
        return new ContentsExistResult(response.getResult());
    }
}
