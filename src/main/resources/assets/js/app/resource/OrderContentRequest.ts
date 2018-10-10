import SetChildOrderJson = api.content.json.SetChildOrderJson;
import ContentJson = api.content.json.ContentJson;
import ContentId = api.content.ContentId;
import {ContentResourceRequest} from './ContentResourceRequest';
import {Content} from '../content/Content';

export class OrderContentRequest extends ContentResourceRequest<ContentJson, Content> {

    private silent: boolean = false;

    private contentId: ContentId;

    private childOrder: api.content.order.ChildOrder;

    constructor() {
        super();
        super.setMethod('POST');
    }

    setContentId(value: ContentId): OrderContentRequest {
        this.contentId = value;
        return this;
    }

    setChildOrder(value: api.content.order.ChildOrder): OrderContentRequest {
        this.childOrder = value;
        return this;
    }

    setSilent(silent: boolean): OrderContentRequest {
        this.silent = silent;
        return this;
    }

    getParams(): Object {
        return this.contentToJson();
    }

    private contentToJson(): SetChildOrderJson {
        return api.content.order.ChildOrder.toSetChildOrderJson(this.contentId, this.childOrder, this.silent);
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'setChildOrder');
    }

    sendAndParse(): wemQ.Promise<Content> {

        return this.send().then((response: api.rest.JsonResponse<ContentJson>) => {

            return this.fromJsonToContent(response.getResult());

        });
    }

}
