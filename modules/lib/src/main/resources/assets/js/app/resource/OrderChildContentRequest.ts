import {OrderChildMovements} from './order/OrderChildMovements';
import {ReorderChildContentsJson} from './json/ReorderChildContentsJson';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ContentId} from '../content/ContentId';
import {ChildOrder} from './order/ChildOrder';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class OrderChildContentRequest
    extends CmsContentResourceRequest<any> {

    private silent: boolean = false;

    private manualOrder: boolean = false;

    private contentId: ContentId;

    private childOrder: ChildOrder;

    private contentMovements: OrderChildMovements;

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('reorderChildren');
    }

    setSilent(silent: boolean): OrderChildContentRequest {
        this.silent = silent;
        return this;
    }

    setManualOrder(manualOrder: boolean): OrderChildContentRequest {
        this.manualOrder = manualOrder;
        return this;
    }

    setContentId(value: ContentId): OrderChildContentRequest {
        this.contentId = value;
        return this;
    }

    setChildOrder(value: ChildOrder): OrderChildContentRequest {
        this.childOrder = value;
        return this;
    }

    setContentMovements(value: OrderChildMovements): OrderChildContentRequest {
        this.contentMovements = value;
        return this;
    }

    getParams(): ReorderChildContentsJson {
        return {
            silent: this.silent,
            manualOrder: this.manualOrder,
            contentId: this.contentId.toString(),
            childOrder: this.childOrder ? this.childOrder.toJson() : undefined,
            reorderChildren: this.contentMovements.toArrayJson()
        };
    }

    protected parseResponse(response: JsonResponse<any>): any {
        return response.getResult();
    }
}
