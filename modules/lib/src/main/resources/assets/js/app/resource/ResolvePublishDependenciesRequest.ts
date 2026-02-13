import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ResolvePublishDependenciesResult} from './ResolvePublishDependenciesResult';
import {type ResolvePublishContentResultJson} from './json/ResolvePublishContentResultJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {type ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class ResolvePublishDependenciesRequest
    extends CmsContentResourceRequest<ResolvePublishDependenciesResult> {

    private ids: ContentId[] = [];

    private excludedIds: ContentId[] = [];

    private excludeChildrenIds: ContentId[] = [];

    constructor(builder: ResolvePublishDependenciesRequestBuilder) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = builder.ids;
        this.excludedIds = builder.excludedIds;
        this.excludeChildrenIds = builder.excludeChildrenIds;
        this.addRequestPathElements('resolvePublishContent');
    }

    getParams(): object {
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

    protected parseResponse(response: JsonResponse<ResolvePublishContentResultJson>): ResolvePublishDependenciesResult {
        return ResolvePublishDependenciesResult.fromJson(response.getResult());
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
