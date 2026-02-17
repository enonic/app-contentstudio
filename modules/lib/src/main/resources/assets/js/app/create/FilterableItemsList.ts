import {NewContentDialogList} from './NewContentDialogList';
import {NewContentDialogListItem} from './NewContentDialogListItem';
import {type ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeComparator} from '../inputtype/schema/ContentTypeComparator';

export class FilterableItemsList
    extends NewContentDialogList {

    private contentTypes: ContentTypeSummary[];

    createItems(contentTypes: ContentTypeSummary[]): void {
        this.contentTypes = contentTypes;

        this.setItems(this.getAllItems());
    }

    filter(value?: string): void {
        if (!value) {
            this.setItems(this.getAllItems());
            return;
        }

        const valueLowerCase: string = value.toLowerCase();

        const filteredItems: NewContentDialogListItem[] = this.getAllItems().filter(
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
