import '../../api.ts';
import i18n = api.util.i18n;

export class ContentDuplicateDialogAction
    extends api.ui.Action {
    constructor() {
        super(i18n('action.duplicate'));
        this.setIconClass('duplicate-action');
    }
}
