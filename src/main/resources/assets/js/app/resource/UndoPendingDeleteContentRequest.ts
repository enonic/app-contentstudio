import * as Q from 'q';
import {showSuccess, showWarning} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {UndoPendingDeleteContentResultJson} from './json/UndoPendingDeleteContentResultJson';
import {ContentResourceRequest} from './ContentResourceRequest';

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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'undoPendingDelete');
    }

    sendAndParse(): Q.Promise<number> {
        return this.send().then((response: JsonResponse<UndoPendingDeleteContentResultJson>) => {
            return response.getResult().success;
        });
    }

    static showResponse(result: number) {
        if (result > 0) {
            showSuccess(result === 1 ? i18n('notify.item.undeleted') : i18n('notify.items.undeleted'));
        } else {
            showWarning(i18n('notify.nothingToUndelete'));
        }
    }
}
