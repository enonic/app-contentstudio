import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getCurrentItems} from '../../../v6/features/store/contentTreeSelection.store';
import {SortContentEvent} from '../sort/SortContentEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class SortContentAction extends ContentTreeGridAction {

    constructor() {
        super(i18n('action.sort'));

        this.setEnabled(false).setClass('sort');
    }

    protected handleExecuted() {
        new SortContentEvent([...getCurrentItems()]).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && state.isSingleNonLeaf() && state.canCreate();
    }
}
