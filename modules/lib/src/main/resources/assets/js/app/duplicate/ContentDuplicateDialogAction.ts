import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Action} from '@enonic/lib-admin-ui/ui/Action';

export class ContentDuplicateDialogAction
    extends Action {
    constructor() {
        super(i18n('action.duplicate'));
        this.setIconClass('duplicate-action');
    }
}
