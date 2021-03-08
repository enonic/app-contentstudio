import {i18n} from 'lib-admin-ui/util/Messages';
import {Action} from 'lib-admin-ui/ui/Action';

export class ContentDuplicateDialogAction
    extends Action {
    constructor() {
        super(i18n('action.duplicate'));
        this.setIconClass('duplicate-action');
    }
}
