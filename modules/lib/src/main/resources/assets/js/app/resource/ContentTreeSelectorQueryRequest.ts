import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';
import {ResultMetadata} from './ResultMetadata';
import {ContentSelectorRequest} from './ContentSelectorRequest';
import {ContentSummary} from '../content/ContentSummary';
import {ChildOrder} from './order/ChildOrder';
import {ContentPath} from '../content/ContentPath';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentTreeSelectorListJson} from './json/ContentTreeSelectorListJson';

export class ContentTreeSelectorQueryRequest<DATA extends ContentTreeSelectorItem>
    extends ContentSelectorRequest<DATA> {

    protected size: number = 10;

    private metadata: ResultMetadata;

    private parentPath: ContentPath;

    private childOrder: ChildOrder;

    constructor() {
        super();

        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('treeSelectorQuery');
    }

    setContent(content: ContentSummary) {
        super.setContent(content);
        this.setSearchString();

        this.childOrder = content ? content.getChildOrder() : null;
        this.parentPath = content ? content.getPath().getParentPath() : null;
    }

    setParentPath(parentPath: ContentPath) {
        this.parentPath = parentPath;
    }

    setChildOrder(childOrder: ChildOrder) {
        this.childOrder = childOrder;
    }

    getParams(): object {
        let params = super.getParams();
        return Object.assign(params, {
            parentPath: this.parentPath ? this.parentPath.toString() : null,
            childOrder: this.childOrder ? this.childOrder.toString() : ''
        });
    }

    getMetadata(): ResultMetadata {
        return this.metadata;
    }

    protected parseResponse(response: JsonResponse<ContentTreeSelectorListJson>): DATA[] {
        if (response.getResult() && response.getResult().items.length > 0) {
            this.metadata = ResultMetadata.fromJson(response.getResult().metadata);
            return response.getResult().items.map(json => ContentTreeSelectorItem.fromJson(json)) as DATA[];
        }

        this.metadata = new ResultMetadata(0, 0);
        return [];
    }
}
