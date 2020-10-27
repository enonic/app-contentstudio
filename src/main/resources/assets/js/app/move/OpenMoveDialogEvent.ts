import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentTreeGrid} from '../browse/ContentTreeGrid';

export class OpenMoveDialogEvent
    extends Event {
    private content: ContentSummary[];
    private treeGrid: ContentTreeGrid;

    constructor(content: ContentSummary[], treeGrid?: ContentTreeGrid) {
        super();
        this.content = content;
        this.treeGrid = treeGrid;
    }

    getContentSummaries(): ContentSummary[] {
        return this.content;
    }

    getTreeGrid(): ContentTreeGrid {
        return this.treeGrid;
    }

    static on(handler: (event: OpenMoveDialogEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: OpenMoveDialogEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
