import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getSelectedItems} from '../../../v6/features/store/contentTreeSelectionStore';
import {ContentTreeListElement} from '../../../v6/features/views/browse/grid/ContentTreeListElement';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {openNewContentDialog} from '../../../v6/features/store/dialogs/newContentDialog.store';

export class ShowNewContentDialogAction extends ContentTreeGridAction {

    constructor(grid: ContentTreeListElement) {
        super(grid, i18n('action.new'), 'alt+n');

        this.setEnabled(true).setClass('new');
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = getSelectedItems();
        openNewContentDialog(contents[0]);
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
