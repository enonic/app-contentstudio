import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';
import {ChildOrder} from './order/ChildOrder';
import {SetChildOrderJson} from './json/SetChildOrderJson';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class OrderContentRequest
    extends CmsContentResourceRequest<Content> {

    private silent: boolean = false;

    private contentId: ContentId;

    private childOrder: ChildOrder;

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('setChildOrder');
    }

    setContentId(value: ContentId): OrderContentRequest {
        this.contentId = value;
        return this;
    }

    setChildOrder(value: ChildOrder): OrderContentRequest {
        this.childOrder = value;
        return this;
    }

    setSilent(silent: boolean): OrderContentRequest {
        this.silent = silent;
        return this;
    }

    getParams(): object {
        return this.contentToJson();
    }

    private contentToJson(): SetChildOrderJson {
        return ChildOrder.toSetChildOrderJson(this.contentId, this.childOrder, this.silent);
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }

}
