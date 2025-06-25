import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getCurrentItems} from '../../../v6/features/store/contentTreeSelection.store';
import {openUnpublishDialog} from '../../../v6/features/store/dialogs/unpublishDialog.store';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class UnpublishContentAction extends ContentTreeGridAction {

    constructor() {
        super(i18n('action.unpublish'));

        this.setEnabled(false).setClass('unpublish');
    }

    protected handleExecuted() {
        openUnpublishDialog([...getCurrentItems()]);
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && state.canPublish() && state.hasAnyPublished();
    }
}
