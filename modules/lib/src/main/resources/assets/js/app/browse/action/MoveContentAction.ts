import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentMovePromptEvent} from '../../move/ContentMovePromptEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';

export class MoveContentAction
    extends ContentTreeGridAction {

    constructor(grid: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>) {
        super(grid, i18n('action.moveMore'), 'alt+m');

        this.setEnabled(false).setClass('move');
    }

    protected handleExecuted() {
        const contents = this.grid.getSelectedItems().map(content => content.getContentSummary());
        new ContentMovePromptEvent(contents).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && this.isAnyRootItemNotSelected() && state.canDelete();
    }

    private isAnyRootItemNotSelected(): boolean {
        return this.grid.getSelectedItems().length > 0;
    }
}
