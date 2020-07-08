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
        new MoveContentEvent(contents, this.grid.getRoot().getDefaultRoot()).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isManagedActionExecuting() && !state.hasAnyInherited() && !this.grid.isAllSelected();
    }
}
