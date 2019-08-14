import ContentId = api.content.ContentId;
import {ContentResourceRequest} from './ContentResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';

export class UpdateContentInherited
    extends ContentResourceRequest<ContentJson, Content> {

    private id: ContentId;

    constructor(id: ContentId) {
        super();
        super.setMethod('GET');
        this.id = id;
    }

    getParams(): Object {
        return {
            id: this.id.toString()
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'updateInherited');
    }

    sendAndParse(): wemQ.Promise<Content> {

        return this.send().then((response: api.rest.JsonResponse<ContentJson>) => {
            return this.fromJsonToContent(response.getResult());
        });
    }
}
