import '../../api.ts';
import {ContentTreeGridActions} from './action/ContentTreeGridActions';

export class ContentBrowseToolbar extends api.ui.toolbar.Toolbar {

    constructor(actions: ContentTreeGridActions) {
        super();
        this.addClass('content-browse-toolbar');
        actions.getUndoPendingDeleteAction().setVisible(false);
        this.addActions(actions.getAllActionsNoPublish());
    }
}
