import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ResolveDependenciesResult, ResolveDependenciesResultJson} from './ResolveDependenciesResult';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {Branch} from '../versioning/Branch';

export class ResolveDependenciesRequest
    extends CmsContentResourceRequest<ResolveDependenciesResult> {

    private ids: ContentId[];

    private target: Branch;

    constructor(contentIds: ContentId[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = contentIds;
        this.addRequestPathElements('getDependencies');
    }

    setTarget(target: Branch): ResolveDependenciesRequest {
        this.target = target;
        return this;
    }

    getParams(): object {
        return {
            contentIds: this.ids.map(id => id.toString()),
            target: this.target?.toString() || Branch.DRAFT,
        };
    }

    protected parseResponse(response: JsonResponse<ResolveDependenciesResultJson>): ResolveDependenciesResult {
        return ResolveDependenciesResult.fromJson(response.getResult());
    }
}
