import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentsExistByPathJson} from './json/ContentsExistByPathJson';
import {ContentsExistByPathResult} from './ContentsExistByPathResult';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class ContentExistsByPathRequest
    extends CmsContentResourceRequest<boolean> {

    private readonly contentPath: string;

    constructor(contentPath: string) {
        super();
        this.setMethod(HttpMethod.POST);
        this.contentPath = contentPath;
        this.addRequestPathElements('contentsExistByPath');
    }

    getParams(): object {
        return {
            contentPaths: [this.contentPath]
        };
    }

    protected parseResponse(response: JsonResponse<ContentsExistByPathJson>): boolean {
       const result: ContentsExistByPathResult = new ContentsExistByPathResult(response.getResult());

        return result.getContentsExistMap()[this.contentPath];
    }
}
