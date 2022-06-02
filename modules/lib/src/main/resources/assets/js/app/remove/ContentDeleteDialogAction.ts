import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Action} from '@enonic/lib-admin-ui/ui/Action';

export class ContentDeleteDialogAction
    extends Action {
    constructor() {
        super(i18n('dialog.delete'));
        this.setIconClass('delete-action');
    }
}
