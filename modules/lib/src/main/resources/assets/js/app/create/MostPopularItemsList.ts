import {MostPopularItem} from './MostPopularItem';
import {NewContentDialogList} from './NewContentDialogList';
import {AggregateContentTypesResult, ContentTypeAggregation} from '../resource/AggregateContentTypesResult';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentTypeSummaries} from '../content/ContentTypeSummaries';

export class MostPopularItemsList extends NewContentDialogList {

    public static DEFAULT_MAX_ITEMS: number = 2;

    constructor() {
        super('most-popular-content-types-list');
    }

    createItems(contentTypes: ContentTypeSummaries, aggregations: AggregateContentTypesResult): number {
        const mostPopularItems: MostPopularItem[] = [];
        const allowedContentTypeAggregations: ContentTypeAggregation[] =
            aggregations.getAggregations().filter((aggregation: ContentTypeAggregation) => {
                return this.isAllowedContentType(aggregation.getContentType());
            });

        for (let i = 0; i < allowedContentTypeAggregations.length && i < MostPopularItemsList.DEFAULT_MAX_ITEMS; i++) {
            const contentType: ContentTypeSummary = contentTypes.getByName(allowedContentTypeAggregations[i].getContentType());
            if (contentType) {
                mostPopularItems.push(new MostPopularItem(contentType, allowedContentTypeAggregations[i].getCount()));
            }
        }

        this.setItems(mostPopularItems);

        return mostPopularItems.length;
    }

    private isAllowedContentType(contentType: ContentTypeName) {
        return !contentType.isMedia() && !contentType.isDescendantOfMedia() && !contentType.isFragment();
    }
}
