import {ContentTreeGrid} from '../ContentTreeGrid';
import {EditContentEvent} from '../../event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';
import {showWarning} from 'lib-admin-ui/notify/MessageBus';

export class EditContentAction extends Action {

    private static MAX_ITEMS_TO_EDIT: number = 50;

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.edit'), 'mod+e');
        this.setEnabled(false);
        this.onExecuted(() => {
            let contents: ContentSummaryAndCompareStatus[]
                = grid.getSelectedDataList().filter((content) => !content.isReadOnly());

            if (contents.length > EditContentAction.MAX_ITEMS_TO_EDIT) {
                showWarning(i18n('notify.edit.tooMuch'));
            } else {
                new EditContentEvent(contents).fire();
            }

        });
    }
}
