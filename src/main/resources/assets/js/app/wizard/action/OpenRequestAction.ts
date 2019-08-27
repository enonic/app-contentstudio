import Action = api.ui.Action;
import i18n = api.util.i18n;

export class OpenRequestAction
    extends Action {

    constructor() {
        super(i18n('action.openRequest'));
    }
}
