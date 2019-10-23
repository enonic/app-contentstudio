import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {BaseContentModelEvent} from '../browse/BaseContentModelEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';

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
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: MoveContentEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
