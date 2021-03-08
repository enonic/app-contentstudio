import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ResolveDependenciesResult, ResolveDependenciesResultJson} from './ResolveDependenciesResult';
import {ContentResourceRequest} from './ContentResourceRequest';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class ResolveDependenciesRequest
    extends ContentResourceRequest<ResolveDependenciesResult> {

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
