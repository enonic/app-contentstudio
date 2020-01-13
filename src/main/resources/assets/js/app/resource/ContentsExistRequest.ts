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
        this.addRequestPathElements('contentsExist');
    }

    getParams(): Object {
        return {
            contentIds: this.contentIds
        };
    }

    protected processResponse(response: JsonResponse<ContentsExistJson>): ContentsExistResult {
        return new ContentsExistResult(response.getResult());
    }
}
