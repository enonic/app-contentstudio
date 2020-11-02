import {MoveContentEvent} from '../../move/MoveContentEvent';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class MoveContentAction extends ContentTreeGridAction {

    constructor(grid: ContentTreeGrid) {
        super(grid, i18n('action.moveMore'));
        this.setEnabled(false);
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[]
            = this.grid.getSelectedDataList();
        new MoveContentEvent(contents, this.grid).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() &&
               (this.getCurrentSelectedOrHighlightedTotal() < this.grid.getDefaultFullTotal()) &&
               state.canDelete();
    }

    private getCurrentSelectedOrHighlightedTotal(): number {
        return this.grid.hasHighlightedNode() ? 1 : this.grid.getTotalSelected();
    }
}
