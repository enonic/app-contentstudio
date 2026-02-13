import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type Content} from '../content/Content';
import {type ContentJson} from '../content/ContentJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {type ContentId} from '../content/ContentId';
import {ChildOrder} from './order/ChildOrder';
import {type SetChildOrderJson} from './json/SetChildOrderJson';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class OrderContentRequest
    extends CmsContentResourceRequest<Content> {

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

    getParams(): object {
        return this.contentToJson();
    }

    private contentToJson(): SetChildOrderJson {
        return ChildOrder.toSetChildOrderJson(this.contentId, this.childOrder);
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }

}
