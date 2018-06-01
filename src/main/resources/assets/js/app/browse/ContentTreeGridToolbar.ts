import {ShowIssuesDialogButton} from '../issue/view/ShowIssuesDialogButton';
import {ContentTreeGrid} from './ContentTreeGrid';

export class ContentTreeGridToolbar
    extends api.ui.treegrid.TreeGridToolbar {

    private issuesDialogButton: ShowIssuesDialogButton;

    constructor(treeGrid: ContentTreeGrid) {
        super(treeGrid);
        this.addClass('content-tree-grid-toolbar');
        this.issuesDialogButton = new ShowIssuesDialogButton();
        this.appendToCenter(this.issuesDialogButton);
    }


    public getIssuesDialogButton(): ShowIssuesDialogButton {
        return this.issuesDialogButton;
    }
}
