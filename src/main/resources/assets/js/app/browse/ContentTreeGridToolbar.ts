import {ContentTreeGrid} from './ContentTreeGrid';
import {TreeGridToolbar} from 'lib-admin-ui/ui/treegrid/TreeGridToolbar';

export class ContentTreeGridToolbar
    extends TreeGridToolbar {

    constructor(treeGrid: ContentTreeGrid) {
        super(treeGrid);
        this.addClass('content-tree-grid-toolbar');
    }

}
