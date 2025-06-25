import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getCurrentItems} from '../../../v6/features/store/contentTreeSelection.store';
import {openNewContentDialog} from '../../../v6/features/store/dialogs/newContentDialog.store';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class ShowNewContentDialogAction extends ContentTreeGridAction {

    constructor() {
        super(i18n('action.new'), 'alt+n');

        this.setEnabled(true).setClass('new');
    }

    protected handleExecuted() {
        openNewContentDialog(getCurrentItems()[0]);
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
