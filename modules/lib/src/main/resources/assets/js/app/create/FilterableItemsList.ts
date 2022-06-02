import {NewContentDialogList} from './NewContentDialogList';
import {NewContentDialogListItem} from './NewContentDialogListItem';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeComparator} from '../inputtype/schema/ContentTypeComparator';
import {ContentTypeSummaries} from '../content/ContentTypeSummaries';

export class FilterableItemsList extends NewContentDialogList {

    private contentTypes: ContentTypeSummaries;

    createItems(contentTypes: ContentTypeSummaries) {
        this.contentTypes = contentTypes;

        this.setItems(this.getAllItems());
    }

    filter(value?: string) {
        if (!value) {
            this.setItems(this.getAllItems());
            return;
        }

        const valueLowerCase = value.toLowerCase();

        const filteredItems = this.getAllItems().filter(
            (item: NewContentDialogListItem) => item.getSearchIndex().indexOf(valueLowerCase) > 0
        );

        this.setItems(filteredItems);
    }

    private getAllItems(): NewContentDialogListItem[] {
        return this.contentTypes
            .sort(ContentTypeComparator.compareItems)
            .map((contentType: ContentTypeSummary) => NewContentDialogListItem.fromContentType(contentType));
    }
}
