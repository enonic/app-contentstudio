import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {Comparator} from '@enonic/lib-admin-ui/Comparator';

export class ContentNodeByDisplayNameComparator
    implements Comparator<TreeNode<ContentSummaryAndCompareStatus>> {

    compare(a: TreeNode<ContentSummaryAndCompareStatus>, b: TreeNode<ContentSummaryAndCompareStatus>): number {
        let firstName: string;
        let secondName: string;
        if (!a.getData().getContentSummary()) {
            return 1;
        } else {
            firstName = a.getData().getContentSummary().getDisplayName() || '';
        }
        if (!b.getData().getContentSummary()) {
            return -1;
        } else {
            secondName = b.getData().getContentSummary().getDisplayName() || '';
        }
        return firstName.localeCompare(secondName);
    }
}
