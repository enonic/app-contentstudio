import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentResponse} from './ContentResponse';
import {type ListContentResult} from './ListContentResult';
import {ResultMetadata} from './ResultMetadata';
import {Expand} from '@enonic/lib-admin-ui/rest/Expand';
import {ContentSummary} from '../content/ContentSummary';
import {type ContentId} from '../content/ContentId';
import {type ChildOrder} from './order/ChildOrder';
import {type ContentSummaryJson} from '../content/ContentSummaryJson';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class ListContentByIdRequest
    extends CmsContentResourceRequest<ContentResponse<ContentSummary>> {

    private parentId: ContentId;

    private expand: Expand = Expand.SUMMARY;

    private from: number;

    private size: number;

    private order: ChildOrder;

    constructor(parentId: ContentId) {
        super();
        this.parentId = parentId;
        this.addRequestPathElements('list');
    }

    setExpand(value: Expand): ListContentByIdRequest {
        this.expand = value;
        return this;
    }

    setFrom(value: number): ListContentByIdRequest {
        this.from = value;
        return this;
    }

    setSize(value: number): ListContentByIdRequest {
        this.size = value;
        return this;
    }

    setOrder(value: ChildOrder): ListContentByIdRequest {
        this.order = value;
        return this;
    }

    getParams(): object {
        return {
            parentId: this.parentId ? this.parentId.toString() : null,
            expand: this.expand,
            from: this.from,
            size: this.size,
            childOrder: this.order ? this.order.toString() : ''
        };
    }

    protected parseResponse(response: JsonResponse<ListContentResult<ContentSummaryJson>>): ContentResponse<ContentSummary> {
        return new ContentResponse(
            ContentSummary.fromJsonArray(response.getResult().contents),
            ResultMetadata.fromJson(response.getResult().metadata),
        );
    }
}
