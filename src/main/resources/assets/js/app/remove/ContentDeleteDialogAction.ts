import {i18n} from 'lib-admin-ui/util/Messages';
import {Action} from 'lib-admin-ui/ui/Action';

export class ContentDeleteDialogAction
    extends Action {
    constructor() {
        super(i18n('dialog.deleteNow'));
        this.setIconClass('delete-action');
    }
}
