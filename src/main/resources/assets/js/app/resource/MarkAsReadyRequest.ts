import {ContentResourceRequest} from './ContentResourceRequest';
import ContentId = api.content.ContentId;

export class MarkAsReadyRequest
    extends ContentResourceRequest<void, void> {

    private ids: ContentId[];

    constructor(ids: ContentId[]) {
        super();
        super.setMethod('POST');
        this.ids = ids;
    }

    getParams(): Object {
        return {
            contentIds: this.ids.map((contentId: ContentId) => contentId.toString())
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'markAsReady');
    }

    sendAndParse(): wemQ.Promise<void> {
        return this.send().then(() => {
            return;
        });
    }

}
