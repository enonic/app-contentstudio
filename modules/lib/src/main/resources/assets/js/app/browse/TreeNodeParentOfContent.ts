import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class TreeNodeParentOfContent {

    private children: ContentSummaryAndCompareStatus[];

    private node: TreeNode<ContentSummaryAndCompareStatus>;

    constructor(children: ContentSummaryAndCompareStatus[] = [], node: TreeNode<ContentSummaryAndCompareStatus>) {
        this.children = children;
        this.node = node;
    }

    getChildren(): ContentSummaryAndCompareStatus[] {
        return this.children;
    }

    getNode(): TreeNode<ContentSummaryAndCompareStatus> {
        return this.node;
    }

    addChild(child: ContentSummaryAndCompareStatus) {
        this.children.push(child);
    }
}
