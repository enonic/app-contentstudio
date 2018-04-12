import '../../api.ts';
import {MostPopularItem} from './MostPopularItem';
import {NewContentDialogList} from './NewContentDialogList';
import ContentTypeSummary = api.schema.content.ContentTypeSummary;
import AggregateContentTypesResult = api.content.resource.result.AggregateContentTypesResult;
import ContentTypeAggregation = api.content.resource.result.ContentTypeAggregation;
import ContentTypeSummaries = api.schema.content.ContentTypeSummaries;
import ContentTypeName = api.schema.content.ContentTypeName;

export class MostPopularItemsList extends NewContentDialogList {

    public static DEFAULT_MAX_ITEMS: number = 2;

    constructor() {
        super('most-popular-content-types-list');
    }

    createItemView(item: MostPopularItem): api.dom.LiEl {
        const namesAndIconView = new api.app.NamesAndIconViewBuilder().setSize(api.app.NamesAndIconViewSize.small).build();
        namesAndIconView
            .setIconUrl(item.getIconUrl())
            .setMainName(item.getDisplayName() + ' (' + item.getHits() + ')')
            .setSubName(item.getName())
            .setDisplayIconLabel(item.isSite());

        const itemEl = new api.dom.LiEl('content-types-list-item' + (item.isSite() ? ' site' : ''));
        itemEl.getEl().setTabIndex(0);
        itemEl.appendChild(namesAndIconView);
        itemEl.onClicked((event: MouseEvent) => this.notifySelected(item));
        itemEl.onKeyPressed((event: KeyboardEvent) => {
            if (event.keyCode === 13) {
                this.notifySelected(item);
            }
        });
        return itemEl;
    }

    createItems(contentTypes: ContentTypeSummaries, aggregations: AggregateContentTypesResult) {

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
    }

    private isAllowedContentType(contentType: ContentTypeName) {
        return !contentType.isMedia() && !contentType.isDescendantOfMedia();
    }
}
