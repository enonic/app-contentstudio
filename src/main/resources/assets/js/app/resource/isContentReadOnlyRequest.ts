import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';

export class IsContentReadOnlyRequest
    extends ContentResourceRequest<string[], string[]> {

    private ids: ContentId[];

    constructor(ids: ContentId[]) {
        super();
        super.setMethod('POST');
        this.ids = ids;
        this.addRequestPathElements('isReadOnlyContent');
    }

    getParams(): Object {
        return {
            contentIds: this.ids.map(id => id.toString())
        };
    }

    protected processResponse(response: JsonResponse<string[]>): string[] {
        return response.getResult();
    }
}
