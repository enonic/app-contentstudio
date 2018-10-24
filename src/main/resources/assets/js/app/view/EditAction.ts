import {EditContentEvent} from '../event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import i18n = api.util.i18n;

export class EditAction extends api.ui.Action {

    constructor(panel: api.app.view.ItemViewPanel<ContentSummaryAndCompareStatus>) {
        super(i18n('action.edit'));
        this.onExecuted(() => {
            new EditContentEvent([panel.getItem().getModel()]).fire();
        });
    }
}
