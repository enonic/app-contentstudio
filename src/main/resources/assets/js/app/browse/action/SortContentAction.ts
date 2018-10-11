import {ContentTreeGrid} from '../ContentTreeGrid';
import {SortContentEvent} from '../SortContentEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import Action = api.ui.Action;
import i18n = api.util.i18n;

export class SortContentAction extends Action {

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.sortMore'));
        this.setEnabled(false);
        this.onExecuted(() => {
            let contents: ContentSummaryAndCompareStatus[]
                = grid.getSelectedDataList();
            new SortContentEvent(contents).fire();
        });
    }
}
