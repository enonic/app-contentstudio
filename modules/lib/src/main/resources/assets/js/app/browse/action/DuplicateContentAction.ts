import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getCurrentItems} from '../../../v6/features/store/contentTreeSelection.store';
import {openDuplicateDialog} from '../../../v6/features/store/dialogs/duplicateDialog.store';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class DuplicateContentAction
    extends ContentTreeGridAction {

    constructor() {
        super(i18n('action.duplicate'));

        this.setEnabled(false).setClass('duplicate');
    }

    protected handleExecuted() {
        openDuplicateDialog([...getCurrentItems()]);
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && state.canCreate();
    }
}
