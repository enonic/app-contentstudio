import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getCurrentItemsAsCSCS} from '../../../v6/features/store/contentTreeSelection.store';
import {SortContentEvent} from '../sort/SortContentEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {type ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class SortContentAction extends ContentTreeGridAction {

    constructor() {
        super(i18n('action.sort'));

        this.setEnabled(false).setClass('sort');
    }

    protected handleExecuted() {
        new SortContentEvent([...getCurrentItemsAsCSCS()]).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return state.isSingle() && state.canCreate();
    }
}
