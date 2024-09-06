import {showSuccess, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {UndoPendingDeleteContentResultJson} from './json/UndoPendingDeleteContentResultJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class UndoPendingDeleteContentRequest
    extends CmsContentResourceRequest<number> {

    private ids: ContentId[];

    constructor(ids: ContentId[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = ids;
        this.addRequestPathElements('undoPendingDelete');
    }

    getParams(): object {
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
