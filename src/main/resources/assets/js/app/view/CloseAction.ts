import i18n = api.util.i18n;
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class CloseAction extends api.ui.Action {

    constructor(itemViewPanel: api.app.view.ItemViewPanel<ContentSummaryAndCompareStatus>,
                checkCanRemovePanel: boolean = true) {
        super(i18n('action.close'), 'mod+alt+f4');

        this.onExecuted(() => {
            itemViewPanel.close(checkCanRemovePanel);
        });
    }
}
