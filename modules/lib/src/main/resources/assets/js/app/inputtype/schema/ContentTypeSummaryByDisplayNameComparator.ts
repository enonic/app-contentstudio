import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {Comparator} from 'lib-admin-ui/Comparator';

export class ContentTypeSummaryByDisplayNameComparator
    implements Comparator<ContentTypeSummary> {

    compare(item1: ContentTypeSummary, item2: ContentTypeSummary): number {
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
