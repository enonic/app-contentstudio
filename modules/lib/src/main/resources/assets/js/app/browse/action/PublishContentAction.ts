import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getSelectedItems} from '../../../v6/features/store/contentTreeSelectionStore';
import {openPublishDialog} from '../../../v6/features/store/dialogs/publishDialog.store';
import {ContentTreeListElement} from '../../../v6/features/views/browse/grid/ContentTreeListElement';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class PublishContentAction extends ContentTreeGridAction {

    private includeChildItems: boolean = false;

    constructor(grid: ContentTreeListElement, includeChildItems: boolean = false, useShortcut: boolean = true) {
        super(grid, i18n('action.publish'), useShortcut ? 'ctrl+alt+p' : null);

        this.setEnabled(false).setClass('publish');

        this.includeChildItems = includeChildItems;
    }

    protected handleExecuted() {
        openPublishDialog(getSelectedItems(), this.includeChildItems);
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return state.isReadyForPublishing();
    }
}
