import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getSelectedItems} from '../../../v6/features/store/contentTreeSelectionStore';
import {ContentTreeListElement2} from '../../../v6/features/views/browse/grid/ContentTreeListElement2';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {openDeleteDialog} from '../../../v6/features/store/dialogs/deleteDialog.store';

export class ArchiveContentAction extends ContentTreeGridAction {

    constructor(grid: ContentTreeListElement2) {
        super(grid, i18n('action.archive'), 'mod+del');

        this.setEnabled(false).setClass('archive');
    }

    protected handleExecuted() {
        openDeleteDialog(getSelectedItems());
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && state.hasAnyDeletable() &&
               state.canDelete();
    }
}
