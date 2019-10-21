import '../../api.ts';
import i18n = api.util.i18n;

export class ContentDeleteDialogAction
    extends api.ui.Action {
    constructor() {
        super(i18n('dialog.deleteNow'));
        this.setIconClass('delete-action');
    }
}
