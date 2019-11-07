import {ContentTreeGrid} from '../ContentTreeGrid';
import {SortContentEvent} from '../SortContentEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';

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
