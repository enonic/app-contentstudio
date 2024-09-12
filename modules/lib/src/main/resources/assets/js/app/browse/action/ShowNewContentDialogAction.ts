import {ShowNewContentDialogEvent} from '../ShowNewContentDialogEvent';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class ShowNewContentDialogAction extends ContentTreeGridAction {

    constructor(grid: ContentTreeGrid) {
        super(grid, i18n('action.newMore'), 'alt+n');

        this.setEnabled(true).setClass('new');
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = this.grid.getSelectedDataList();
        new ShowNewContentDialogEvent(contents.length > 0 ? contents[0] : null).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return state.canCreate() && (state.isEmpty() || state.isSingle());
    }

    stash() {
        //
    }

    unStash() {
        //
    }
}
