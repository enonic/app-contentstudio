import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentResponse} from './ContentResponse';
import {ListContentResult} from './ListContentResult';
import {ContentMetadata} from '../content/ContentMetadata';
import {Expand} from 'lib-admin-ui/rest/Expand';
import {ChildOrder} from 'lib-admin-ui/content/order/ChildOrder';
import {ContentSummary} from '../content/ContentSummary';

export class ListContentByIdRequest
    extends ContentResourceRequest<ContentResponse<ContentSummary>> {

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

    getParams(): Object {
        return {
            parentId: this.parentId ? this.parentId.toString() : null,
            expand: this.expand,
            from: this.from,
            size: this.size,
            childOrder: !!this.order ? this.order.toString() : ''
        };
    }

    protected parseResponse(response: JsonResponse<ListContentResult<ContentSummaryJson>>): ContentResponse<ContentSummary> {
        return new ContentResponse(
            ContentSummary.fromJsonArray(response.getResult().contents),
            new ContentMetadata(response.getResult().metadata['hits'], response.getResult().metadata['totalHits'])
        );
    }
}
