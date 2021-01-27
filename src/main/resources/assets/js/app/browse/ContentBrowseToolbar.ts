import {ActionName, ContentTreeGridActions} from './action/ContentTreeGridActions';
import {Toolbar} from 'lib-admin-ui/ui/toolbar/Toolbar';

export class ContentBrowseToolbar
    extends Toolbar {

    constructor(actions: ContentTreeGridActions) {
        super();
        this.addClass('content-browse-toolbar');
        actions.getAction(ActionName.UNDO_PENDING_DELETE).setVisible(false);
        this.addActions(actions.getAllActionsNoPublish());
    }
}
