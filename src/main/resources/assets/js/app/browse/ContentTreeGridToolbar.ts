import '../../api.ts';
import {ShowIssuesDialogButton} from './../issue/view/ShowIssuesDialogButton';

import {ContentTreeGrid} from './ContentTreeGrid';
import TreeGridToolbar = api.ui.treegrid.TreeGridToolbar;

export class ContentTreeGridToolbar extends TreeGridToolbar {

    constructor(treeGrid: ContentTreeGrid) {
        super(treeGrid);

        this.appendChild(new ShowIssuesDialogButton());
    }

}
