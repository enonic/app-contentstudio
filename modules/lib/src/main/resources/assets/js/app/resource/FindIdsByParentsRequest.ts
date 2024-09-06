import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {FindIdsByParentsResult} from './FindIdsByParentsResult';
import {FindIdsByParentsResultJson} from './json/FindIdsByParentsResultJson';

export class FindIdsByParentsRequest
    extends CmsContentResourceRequest<ContentId[]> {

    private readonly ids: string[];

    constructor(ids: ContentId[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('findIdsByParents');
        this.ids = ids.map(id => id.toString());
    }

    getParams(): object {
        return {
            contentIds: this.ids,
        };
    }

    protected parseResponse(response: JsonResponse<FindIdsByParentsResultJson>): ContentId[] {
        return FindIdsByParentsResult.fromJson(response.getResult()).getIds();
    }
}
