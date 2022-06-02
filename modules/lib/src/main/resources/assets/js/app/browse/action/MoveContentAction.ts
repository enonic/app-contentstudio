import {MoveContentEvent} from '../../move/MoveContentEvent';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {ArrayHelper} from '@enonic/lib-admin-ui/util/ArrayHelper';

export class MoveContentAction
    extends ContentTreeGridAction {

    constructor(grid: ContentTreeGrid) {
        super(grid, i18n('action.moveMore'), 'alt+m');
        this.setEnabled(false);
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = this.grid.getSelectedDataList();
        new MoveContentEvent(contents, this.grid).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && this.isAnyRootItemNotSelected() && state.canDelete();
    }

    private isAnyRootItemNotSelected(): boolean {
        // if there's at least one non-selected root item then there's at least one option where to move selected items
        const selectedIds: string[] = this.getSelectedOrHighlightedItemsIds();
        const rootItemsIds: string[] = this.grid.getRootItemsIds();
        const diff: string[] = ArrayHelper.difference(rootItemsIds, selectedIds, (a: string, b: string) => a === b);

        return diff.length > 0;
    }

    private getSelectedOrHighlightedItemsIds(): string[] {
        return this.grid.getSelectedOrHighlightedItems().map((item: ContentSummaryAndCompareStatus) => item.getId());
    }
}
