import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {PageCUDRequest} from '../resource/PageCUDRequest';
import {PageResourceRequest} from '../resource/PageResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';

export class DeletePageRequest
    extends PageResourceRequest<ContentJson, Content>
    implements PageCUDRequest {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        super.setMethod('GET');
        this.contentId = contentId;
    }

    getParams(): Object {
        return {
            contentId: this.contentId.toString()
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'delete');
    }

    sendAndParse(): Q.Promise<Content> {

        return this.send().then((response: JsonResponse<ContentJson>) => {
            return response.isBlank() ? null : this.fromJsonToContent(response.getResult());
        });
    }
}
