import {ShowNewContentDialogEvent} from '../ShowNewContentDialogEvent';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {type ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {type SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';

export class ShowNewContentDialogAction extends ContentTreeGridAction {

    constructor(grid: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>) {
        super(grid, i18n('action.newMore'), 'alt+n');

        this.setEnabled(true).setClass('new');
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = this.grid.getSelectedItems();
        new ShowNewContentDialogEvent(contents.length > 0 ? contents[0] : null).fire();
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
