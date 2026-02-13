import {MostPopularItem} from './MostPopularItem';
import {NewContentDialogList} from './NewContentDialogList';
import {type AggregateContentTypesResult, type ContentTypeAggregation} from '../resource/AggregateContentTypesResult';
import {type ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';

export class MostPopularItemsList extends NewContentDialogList {

    public static DEFAULT_MAX_ITEMS: number = 2;

    constructor() {
        super('most-popular-content-types-list');
    }

    createItems(contentTypes: ContentTypeSummary[], aggregations: AggregateContentTypesResult): number {
        const mostPopularItems: MostPopularItem[] = [];
        const allowedContentTypeAggregations: ContentTypeAggregation[] =
            aggregations.getAggregations().filter((aggregation: ContentTypeAggregation) => {
                return this.isAllowedContentType(aggregation.getContentType());
            });

        for (let i = 0; i < allowedContentTypeAggregations.length && i < MostPopularItemsList.DEFAULT_MAX_ITEMS; i++) {
            const name: string = allowedContentTypeAggregations[i].getContentType().toString();
            const contentType: ContentTypeSummary = contentTypes.find((type: ContentTypeSummary) => type.getName() === name);

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
