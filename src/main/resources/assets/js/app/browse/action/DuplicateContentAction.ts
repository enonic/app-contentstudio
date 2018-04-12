import '../../../api.ts';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {OpenDuplicateDialogEvent} from '../../duplicate/OpenDuplicateDialogEvent';
import Action = api.ui.Action;
import i18n = api.util.i18n;

export class DuplicateContentAction extends Action {

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.duplicate'));
        this.setEnabled(false);
        this.onExecuted(() => {
            const contentToDuplicate = grid.getSelectedDataList().map(el => el.getContentSummary());
            new OpenDuplicateDialogEvent(contentToDuplicate).fire();
        });
    }
}
