import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentTreeSelectorListJson} from './ContentTreeSelectorListResult';
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';
import {ContentMetadata} from '../content/ContentMetadata';
import {ContentSelectorRequest} from './ContentSelectorRequest';
import {ContentSummary} from '../content/ContentSummary';
import {ChildOrder} from './order/ChildOrder';
import {ContentPath} from '../content/ContentPath';

export class ContentTreeSelectorQueryRequest<DATA extends ContentTreeSelectorItem>
    extends ContentSelectorRequest<DATA> {

    protected size: number = 10;

    private metadata: ContentMetadata;

    private parentPath: ContentPath;

    private childOrder: ChildOrder;

    constructor() {
        super();

        this.addRequestPathElements('treeSelectorQuery');
    }

    setContent(content: ContentSummary) {
        super.setContent(content);
        this.setSearchString();
    }

    setParentContent(content: ContentSummary) {
        this.parentPath = content ? content.getPath() : null;
        this.childOrder = content ? content.getChildOrder() : null;
    }

    getParams(): Object {
        let params = super.getParams();
        return Object.assign(params, {
            parentPath: this.parentPath ? this.parentPath.toString() : null,
            childOrder: this.childOrder ? this.childOrder.toString() : ''
        });
    }

    getMetadata(): ContentMetadata {
        return this.metadata;
    }

    protected parseResponse(response: JsonResponse<ContentTreeSelectorListJson>): DATA[] {
        if (response.getResult() && response.getResult().items.length > 0) {
            this.metadata = new ContentMetadata(response.getResult().metadata['hits'], response.getResult().metadata['totalHits']);
            return response.getResult().items.map(json => <any>ContentTreeSelectorItem.fromJson(json));
        }

        this.metadata = new ContentMetadata(0, 0);
        return [];
    }
}
