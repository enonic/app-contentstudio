import {ShowNewContentDialogEvent} from '../ShowNewContentDialogEvent';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import Action = api.ui.Action;
import i18n = api.util.i18n;

export class ShowNewContentDialogAction extends Action {

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.newMore'), 'alt+n');
        this.setEnabled(true);
        this.onExecuted(() => {
            let contents: ContentSummaryAndCompareStatus[]
                = grid.getSelectedDataList();
            new ShowNewContentDialogEvent(contents.length > 0 ? contents[0] : null).fire();
        });
    }
}
