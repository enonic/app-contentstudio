import {MostPopularItem} from './MostPopularItem';
import {NewContentDialogList} from './NewContentDialogList';
import {AggregateContentTypesResult, ContentTypeAggregation} from '../resource/AggregateContentTypesResult';
import ContentTypeSummary = api.schema.content.ContentTypeSummary;
import ContentTypeSummaries = api.schema.content.ContentTypeSummaries;
import ContentTypeName = api.schema.content.ContentTypeName;

export class MostPopularItemsList extends NewContentDialogList {

    public static DEFAULT_MAX_ITEMS: number = 2;

    constructor() {
        super('most-popular-content-types-list');
    }

    createItems(contentTypes: ContentTypeSummaries, aggregations: AggregateContentTypesResult): number {

        let mostPopularItems: MostPopularItem[] = [];
        let allowedContentTypeAggregations: ContentTypeAggregation[] =
            aggregations.getAggregations().filter((aggregation: ContentTypeAggregation) => {
                return this.isAllowedContentType(aggregation.getContentType());
            });

        for (let i = 0; i < allowedContentTypeAggregations.length && i < MostPopularItemsList.DEFAULT_MAX_ITEMS; i++) {
            let contentType: ContentTypeSummary = contentTypes.getByName(allowedContentTypeAggregations[i].getContentType());
            mostPopularItems.push(new MostPopularItem(contentType, allowedContentTypeAggregations[i].getCount()));
        }

        this.setItems(mostPopularItems);

        return mostPopularItems.length;
    }

    private isAllowedContentType(contentType: ContentTypeName) {
        return !contentType.isMedia() && !contentType.isDescendantOfMedia() && !contentType.isFragment();
    }
}
