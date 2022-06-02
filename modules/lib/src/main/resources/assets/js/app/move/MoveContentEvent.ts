import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {BaseContentModelEvent} from '../browse/BaseContentModelEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
import {ContentTreeGrid} from '../browse/ContentTreeGrid';

export class MoveContentEvent extends BaseContentModelEvent {
    private treeGrid: ContentTreeGrid;

    constructor(model: ContentSummaryAndCompareStatus[], treeGrid?: ContentTreeGrid) {
        super(model);
        this.treeGrid = treeGrid;
    }

    getTreeGrid(): ContentTreeGrid {
        return this.treeGrid;
    }

    static on(handler: (event: MoveContentEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: MoveContentEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
