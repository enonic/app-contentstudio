import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {Comparator} from '@enonic/lib-admin-ui/Comparator';

export class ContentNodeByModifiedTimeComparator
    implements Comparator<TreeNode<ContentSummaryAndCompareStatus>> {

    compare(a: TreeNode<ContentSummaryAndCompareStatus>, b: TreeNode<ContentSummaryAndCompareStatus>): number {
        let firstDate = !a.getData().getContentSummary() ? null : a.getData().getContentSummary().getModifiedTime();
        let secondDate = !b.getData().getContentSummary() ? null : b.getData().getContentSummary().getModifiedTime();
        return firstDate < secondDate ? 1 : (firstDate > secondDate) ? -1 : 0;
    }
}
