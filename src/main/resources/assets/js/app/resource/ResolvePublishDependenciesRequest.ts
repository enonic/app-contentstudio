import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ResolvePublishDependenciesResult} from './ResolvePublishDependenciesResult';
import {ResolvePublishContentResultJson} from './json/ResolvePublishContentResultJson';

export class ResolvePublishDependenciesRequest
    extends ContentResourceRequest<ResolvePublishContentResultJson, ResolvePublishDependenciesResult> {

    private ids: ContentId[] = [];

    private excludedIds: ContentId[] = [];

    private excludeChildrenIds: ContentId[] = [];

    constructor(builder: ResolvePublishDependenciesRequestBuilder) {
        super();
        super.setMethod('POST');
        this.ids = builder.ids;
        this.excludedIds = builder.excludedIds;
        this.excludeChildrenIds = builder.excludeChildrenIds;
    }

    getParams(): Object {
        return {
            ids: this.ids.map((el) => {
                return el.toString();
            }),
            excludedIds: this.excludedIds.map((el) => {
                return el.toString();
            }),
            excludeChildrenIds: this.excludeChildrenIds.map((el) => {
                return el.toString();
            })
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'resolvePublishContent');
    }

    sendAndParse(): Q.Promise<ResolvePublishDependenciesResult> {

        return this.send().then((response: JsonResponse<ResolvePublishContentResultJson>) => {
            return ResolvePublishDependenciesResult.fromJson(response.getResult());
        });
    }

    static create() {
        return new ResolvePublishDependenciesRequestBuilder();
    }
}

export class ResolvePublishDependenciesRequestBuilder {

    ids: ContentId[] = [];

    excludedIds: ContentId[] = [];

    excludeChildrenIds: ContentId[] = [];

    public setIds(value: ContentId[]): ResolvePublishDependenciesRequestBuilder {
        this.ids = value;
        return this;
    }

    public setExcludedIds(value: ContentId[]): ResolvePublishDependenciesRequestBuilder {
        this.excludedIds = value;
        return this;
    }

    public setExcludeChildrenIds(value: ContentId[]): ResolvePublishDependenciesRequestBuilder {
        this.excludeChildrenIds = value;
        return this;
    }

    build() {
        return new ResolvePublishDependenciesRequest(this);
    }
}
