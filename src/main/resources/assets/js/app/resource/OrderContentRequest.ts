import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {SetChildOrderJson} from 'lib-admin-ui/content/json/SetChildOrderJson';
import {ContentResourceRequest} from './ContentResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {ChildOrder} from 'lib-admin-ui/content/order/ChildOrder';

export class OrderContentRequest extends ContentResourceRequest<ContentJson, Content> {

    private silent: boolean = false;

    private contentId: ContentId;

    private childOrder: ChildOrder;

    constructor() {
        super();
        super.setMethod('POST');
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

    getParams(): Object {
        return this.contentToJson();
    }

    private contentToJson(): SetChildOrderJson {
        return ChildOrder.toSetChildOrderJson(this.contentId, this.childOrder, this.silent);
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'setChildOrder');
    }

    sendAndParse(): Q.Promise<Content> {

        return this.send().then((response: JsonResponse<ContentJson>) => {

            return this.fromJsonToContent(response.getResult());

        });
    }

}
