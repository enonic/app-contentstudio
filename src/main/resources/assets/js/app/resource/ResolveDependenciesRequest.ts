import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ResolveDependenciesResult, ResolveDependenciesResultJson} from './ResolveDependenciesResult';
import {ContentResourceRequest} from './ContentResourceRequest';

export class ResolveDependenciesRequest
    extends ContentResourceRequest<ResolveDependenciesResultJson, ResolveDependenciesResult> {

    private ids: ContentId[];

    constructor(contentIds: ContentId[]) {
        super();
        super.setMethod('POST');
        this.ids = contentIds;
    }

    getParams(): Object {
        return {
            contentIds: this.ids.map(id => id.toString())
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'getDependencies');
    }

    sendAndParse(): Q.Promise<ResolveDependenciesResult> {

        return this.send().then((response: JsonResponse<any>) => {
            return ResolveDependenciesResult.fromJson(response.getResult());
        });
    }
}
