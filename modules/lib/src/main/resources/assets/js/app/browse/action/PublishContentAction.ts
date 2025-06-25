import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getCurrentItems} from '../../../v6/features/store/contentTreeSelection.store';
import {openPublishDialog} from '../../../v6/features/store/dialogs/publishDialog.store';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class PublishContentAction extends ContentTreeGridAction {

    private includeChildItems: boolean = false;

    constructor(includeChildItems: boolean = false, useShortcut: boolean = true) {
        super(i18n('action.publish'), useShortcut ? 'ctrl+alt+p' : null);

        this.setEnabled(false).setClass('publish');

        this.includeChildItems = includeChildItems;
    }

    protected handleExecuted() {
        openPublishDialog([...getCurrentItems()], this.includeChildItems);
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return state.isReadyForPublishing();
    }
}
