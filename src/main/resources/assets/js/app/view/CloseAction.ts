import {i18n} from 'lib-admin-ui/util/Messages';
import {Action} from 'lib-admin-ui/ui/Action';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ItemViewPanel} from 'lib-admin-ui/app/view/ItemViewPanel';

export class CloseAction
    extends Action {

    constructor(itemViewPanel: ItemViewPanel<ContentSummaryAndCompareStatus>,
                checkCanRemovePanel: boolean = true) {
        super(i18n('action.close'), 'mod+alt+f4');

        this.onExecuted(() => {
            itemViewPanel.close(checkCanRemovePanel);
        });
    }
}
