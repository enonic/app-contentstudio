import {getSelectedItems} from '../../../v6/features/store/contentTreeSelectionStore';
import {openDuplicateDialog} from '../../../v6/features/store/dialogs/duplicateDialog.store';
import {ContentTreeListElement} from '../../../v6/features/views/browse/grid/ContentTreeListElement';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class DuplicateContentAction
    extends ContentTreeGridAction {

    constructor(grid: ContentTreeListElement) {
        super(grid, i18n('action.duplicate'));

        this.setEnabled(false).setClass('duplicate');
    }

    protected handleExecuted() {
        const contents = getSelectedItems();
        openDuplicateDialog(contents);
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && state.canCreate();
    }
}
