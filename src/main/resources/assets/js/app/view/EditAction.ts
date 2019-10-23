import {i18n} from 'lib-admin-ui/util/Messages';
import {Action} from 'lib-admin-ui/ui/Action';
import {EditContentEvent} from '../event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ItemViewPanel} from 'lib-admin-ui/app/view/ItemViewPanel';

export class EditAction
    extends Action {

    constructor(panel: ItemViewPanel<ContentSummaryAndCompareStatus>) {
        super(i18n('action.edit'));
        this.onExecuted(() => {
            new EditContentEvent([panel.getItem().getModel()]).fire();
        });
    }
}
