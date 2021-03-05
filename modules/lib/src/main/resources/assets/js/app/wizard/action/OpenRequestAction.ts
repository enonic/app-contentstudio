import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';

export class OpenRequestAction
    extends Action {

    constructor() {
        super(i18n('action.openRequest'));
    }
}
