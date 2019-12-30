import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentResourceRequest} from './ContentResourceRequest';

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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'markAsReady');
    }

    sendAndParse(): Q.Promise<void> {
        return this.send().then(() => {
            return;
        });
    }

}
