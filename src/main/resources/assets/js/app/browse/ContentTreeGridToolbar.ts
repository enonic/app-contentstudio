import {ContentTreeGrid} from './ContentTreeGrid';

export class ContentTreeGridToolbar
    extends api.ui.treegrid.TreeGridToolbar {

    constructor(treeGrid: ContentTreeGrid) {
        super(treeGrid);
        this.addClass('content-tree-grid-toolbar');
    }

}
