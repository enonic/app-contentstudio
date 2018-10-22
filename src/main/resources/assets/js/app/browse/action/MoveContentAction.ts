import {MoveContentEvent} from '../../move/MoveContentEvent';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import Action = api.ui.Action;
import i18n = api.util.i18n;

export class MoveContentAction extends Action {

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.moveMore'));
        this.setEnabled(false);
        this.onExecuted(() => {
            const contents: ContentSummaryAndCompareStatus[]
                = grid.getSelectedDataList();
            new MoveContentEvent(contents, grid.getRoot().getDefaultRoot()).fire();
        });
    }
}
