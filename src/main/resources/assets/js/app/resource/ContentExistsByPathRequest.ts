import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentsExistByPathJson} from './json/ContentsExistByPathJson';
import {ContentsExistByPathResult} from './ContentsExistByPathResult';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class ContentExistsByPathRequest
    extends ContentResourceRequest<boolean> {

    private readonly contentPath: string;

    constructor(contentPath: string) {
        super();
        this.setMethod(HttpMethod.POST);
        this.contentPath = contentPath;
        this.addRequestPathElements('contentsExistByPath');
    }

    getParams(): Object {
        return {
            contentPaths: [this.contentPath]
        };
    }

    protected parseResponse(response: JsonResponse<ContentsExistByPathJson>): boolean {
       const result: ContentsExistByPathResult = new ContentsExistByPathResult(response.getResult());

        return result.getContentsExistMap()[this.contentPath];
    }
}
