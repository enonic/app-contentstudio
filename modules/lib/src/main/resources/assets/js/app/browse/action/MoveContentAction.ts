import {ArrayHelper} from '@enonic/lib-admin-ui/util/ArrayHelper';
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
        new ContentMovePromptEvent(contents, null).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && this.isAnyRootItemNotSelected() && state.canDelete();
    }

    private isAnyRootItemNotSelected(): boolean {
        // if there's at least one non-selected root item then there's at least one option where to move selected items
        const selectedIds: string[] = this.getSelectedOrHighlightedItemsIds();
        const rootItemsIds: string[] = this.grid.getList().getItems().map((item: ContentSummaryAndCompareStatus) => item.getId());
        const diff: string[] = ArrayHelper.difference(rootItemsIds, selectedIds, (a: string, b: string) => a === b);

        return diff.length > 0;
    }

    private getSelectedOrHighlightedItemsIds(): string[] {
        return this.grid.getSelectedItems().map((item: ContentSummaryAndCompareStatus) => item.getId());
    }
}
