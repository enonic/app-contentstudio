import {showSuccess, showWarning} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {UndoPendingDeleteContentResultJson} from './json/UndoPendingDeleteContentResultJson';
import {ContentResourceRequest} from './ContentResourceRequest';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';

export class UndoPendingDeleteContentRequest
    extends ContentResourceRequest<number> {

    private ids: ContentId[];

    constructor(ids: ContentId[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = ids;
        this.addRequestPathElements('undoPendingDelete');
    }

    getParams(): Object {
        return {
            contentIds: this.ids.map((contentId: ContentId) => contentId.toString())
        };
    }

    protected parseResponse(response: JsonResponse<UndoPendingDeleteContentResultJson>): number {
        return response.getResult().success;
    }

    static showResponse(result: number) {
        if (result > 0) {
            showSuccess(result === 1 ? i18n('notify.item.undeleted') : i18n('notify.items.undeleted'));
        } else {
            showWarning(i18n('notify.nothingToUndelete'));
        }
    }
}
