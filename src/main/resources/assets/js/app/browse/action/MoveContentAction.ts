import {MoveContentEvent} from '../../move/MoveContentEvent';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';

export class MoveContentAction extends Action {

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.moveMore'));
        this.setEnabled(false);
        this.onExecuted(() => {
            const contents: ContentSummaryAndCompareStatus[]
                = grid.getSelectedDataList();
            new MoveContentEvent(contents, grid).fire();
        });
    }
}
