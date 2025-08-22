import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';
import {ResultMetadata} from './ResultMetadata';
import {ContentSelectorRequest} from './ContentSelectorRequest';
import {ContentSummary} from '../content/ContentSummary';
import {ChildOrder} from './order/ChildOrder';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ListContentResult} from './ListContentResult';
import {ContentSummaryJson} from '../content/ContentSummaryJson';


export class ListByIdSelectorRequest<DATA extends ContentTreeSelectorItem>
    extends ContentSelectorRequest<DATA> {

    protected size: number = 10;

    private metadata: ResultMetadata;

    private childOrder: ChildOrder;

    constructor() {
        super();

        this.setMethod(HttpMethod.GET);
        this.addRequestPathElements('list');
    }

    setContent(content: ContentSummary) {
        super.setContent(content);
        this.setSearchString();

        this.childOrder = content ? content.getChildOrder() : null;
    }

    setChildOrder(childOrder: ChildOrder) {
        this.childOrder = childOrder;
    }

    getParams(): object {
        return {
            from: this.getFrom(),
            size: this.getSize(),
            expand: this.expandAsString(),
            parentId: this.content ? this.content.getId().toString() : null,
            childOrder: this.childOrder ? this.childOrder.toString() : ''
        };
    }

    getMetadata(): ResultMetadata {
        return this.metadata;
    }

    protected parseResponse(response: JsonResponse<ListContentResult<ContentSummaryJson>>): DATA[] {
        if (response.getResult() && response.getResult().contents.length > 0) {
            this.metadata = ResultMetadata.fromJson(response.getResult().metadata);
            return response.getResult().contents.map(json =>
                ContentTreeSelectorItem.create().setContent(
                    ContentSummaryAndCompareStatus.fromContentSummary(ContentSummary.fromJson(json))).setExpandable(true).setSelectable(
                    true).build()) as DATA[];
        }

        this.metadata = new ResultMetadata(0, 0);
        return [];
    }

    resetParams() {
        super.resetParams();
        this.content = null;
        this.childOrder = null;
    }
}
