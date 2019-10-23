import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class TreeNodesOfContentPath {

    private path: ContentPath;

    private nodes: TreeNode<ContentSummaryAndCompareStatus>[];

    constructor(path: ContentPath) {
        this.path = path;
        this.nodes = [];
    }

    getPath(): ContentPath {
        return this.path;
    }

    getNodes(): TreeNode<ContentSummaryAndCompareStatus>[] {
        return this.nodes;
    }

    hasNodes(): boolean {
        return this.nodes.length > 0;
    }

    getId(): string {
        return (this.hasNodes() && this.nodes[0].getData()) ? this.nodes[0].getData().getId() : '';
    }

    updateNodeData(data: ContentSummaryAndCompareStatus) {
        this.nodes.forEach((node) => {
            node.setData(data);
            node.clearViewers();
        });
    }
}
