import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getSelectedItems} from '../../../v6/features/store/contentTreeSelectionStore';
import {ContentTreeListElement2} from '../../../v6/features/views/browse/grid/ContentTreeListElement2';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {SortContentEvent} from '../sort/SortContentEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class SortContentAction extends ContentTreeGridAction {

    constructor(grid: ContentTreeListElement2) {
        super(grid, i18n('action.sort'));

        this.setEnabled(false).setClass('sort');
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = getSelectedItems();
        new SortContentEvent(contents).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && state.isSingleNonLeaf() && state.canCreate();
    }
}
