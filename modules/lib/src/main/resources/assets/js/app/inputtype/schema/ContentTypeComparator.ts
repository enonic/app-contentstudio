import {type ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {type Comparator} from '@enonic/lib-admin-ui/Comparator';

export class ContentTypeComparator
    implements Comparator<ContentTypeSummary> {

    compare(item1: ContentTypeSummary, item2: ContentTypeSummary): number {
        return ContentTypeComparator.compareItems(item1, item2);
    }

    static compareItems(item1: ContentTypeSummary, item2: ContentTypeSummary): number {
        if (item1.getDisplayName().toLowerCase() > item2.getDisplayName().toLowerCase()) {
            return 1;
        }
        if (item1.getDisplayName().toLowerCase() < item2.getDisplayName().toLowerCase()) {
            return -1;
        }
        if (item1.getName() > item2.getName()) {
            return 1;
        }
        if (item1.getName() < item2.getName()) {
            return -1;
        }

        return 0;
    }
}
