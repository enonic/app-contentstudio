import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {type ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeSummaryViewer} from '../ui/schema/ContentTypeSummaryViewer';

export class ContentTypeList extends ListBox<ContentTypeSummary> {

    constructor() {
        super('content-type-list');
    }

    protected createItemView(item: ContentTypeSummary, readOnly: boolean): ContentTypeSummaryViewer {
        const viewer = new ContentTypeSummaryViewer();

        viewer.setObject(item);

        return viewer;
    }

    protected getItemId(item: ContentTypeSummary): string {
        return item.getId();
    }

}
