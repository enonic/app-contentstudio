import {NewContentDialogListItem} from './NewContentDialogListItem';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';

export class MostPopularItem extends NewContentDialogListItem {

    private hits: number;

    constructor(contentType: ContentTypeSummary, hits: number) {
        super(contentType);

        this.hits = hits;
    }

    getDisplayName(): string {
        return `${super.getDisplayName()} (${this.hits})`;
    }
}
