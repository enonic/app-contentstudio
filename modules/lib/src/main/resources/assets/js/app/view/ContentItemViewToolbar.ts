import {Action} from 'lib-admin-ui/ui/Action';
import {Toolbar} from 'lib-admin-ui/ui/toolbar/Toolbar';

export interface ContentItemViewToolbarParams {
    editAction: Action;
    deleteAction: Action;
}

export class ContentItemViewToolbar
    extends Toolbar {

    constructor(params: ContentItemViewToolbarParams) {
        super();
        super.addAction(params.editAction);
        super.addAction(params.deleteAction);
    }
}
