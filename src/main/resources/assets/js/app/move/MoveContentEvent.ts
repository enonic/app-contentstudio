import {BaseContentModelEvent} from '../browse/BaseContentModelEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import TreeNode = api.ui.treegrid.TreeNode;

export class MoveContentEvent extends BaseContentModelEvent {
    private rootNode: TreeNode<ContentSummaryAndCompareStatus>;

    constructor(model: ContentSummaryAndCompareStatus[], rootNode?: TreeNode<ContentSummaryAndCompareStatus>) {
        super(model);
        this.rootNode = rootNode;
    }

    getRootNode(): TreeNode<ContentSummaryAndCompareStatus> {
        return this.rootNode;
    }

    static on(handler: (event: MoveContentEvent) => void) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: MoveContentEvent) => void) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler);
    }
}
