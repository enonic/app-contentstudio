import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ResolveDependenciesResult, ResolveDependenciesResultJson} from './ResolveDependenciesResult';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class ResolveDependenciesRequest
    extends CmsContentResourceRequest<ResolveDependenciesResult> {

    private ids: ContentId[];

    constructor(contentIds: ContentId[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = contentIds;
        this.addRequestPathElements('getDependencies');
    }

    getParams(): Object {
        return {
            contentIds: this.ids.map(id => id.toString())
        };
    }

    protected parseResponse(response: JsonResponse<ResolveDependenciesResultJson>): ResolveDependenciesResult {
        return ResolveDependenciesResult.fromJson(response.getResult());
    }
}
