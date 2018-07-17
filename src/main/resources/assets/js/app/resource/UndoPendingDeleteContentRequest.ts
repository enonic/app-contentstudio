import ContentResourceRequest = api.content.resource.ContentResourceRequest;
import i18n = api.util.i18n;
import {UndoPendingDeleteContentResultJson} from './json/UndoPendingDeleteContentResultJson';

export class UndoPendingDeleteContentRequest
    extends ContentResourceRequest<UndoPendingDeleteContentResultJson, number> {

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
        return api.rest.Path.fromParent(super.getResourcePath(), 'undoPendingDelete');
    }

    sendAndParse(): wemQ.Promise<number> {
        return this.send().then((response: api.rest.JsonResponse<UndoPendingDeleteContentResultJson>) => {
            return response.getResult().success;
        });
    }

    static showResponse(result: number) {
        if (result > 0) {
            api.notify.showSuccess(result == 1 ? i18n('notify.item.undeleted') : i18n('notify.items.undeleted'));
        } else {
            api.notify.showWarning(i18n('notify.nothingToUndelete'));
        }
    }
}
