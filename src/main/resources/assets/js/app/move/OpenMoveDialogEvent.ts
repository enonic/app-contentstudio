import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class OpenMoveDialogEvent
    extends Event {
    private content: ContentSummary[];
    private rootNode: TreeNode<ContentSummaryAndCompareStatus>;

    constructor(content: ContentSummary[], rootNode?: TreeNode<ContentSummaryAndCompareStatus>) {
        super();
        this.content = content;
        this.rootNode = rootNode;
    }

    getContentSummaries(): ContentSummary[] {
        return this.content;
    }

    getRootNode(): TreeNode<ContentSummaryAndCompareStatus> {
        return this.rootNode;
    }

    static on(handler: (event: OpenMoveDialogEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: OpenMoveDialogEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
