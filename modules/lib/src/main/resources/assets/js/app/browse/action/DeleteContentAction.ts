import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentDeletePromptEvent} from '../ContentDeletePromptEvent';
import {CompareStatus} from '../../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class DeleteContentAction extends ContentTreeGridAction {

    constructor(grid: ContentTreeGrid) {
        super(grid, i18n('action.deleteMore'), 'mod+del');
        this.setEnabled(false);
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = this.grid.getSelectedDataList();

        new ContentDeletePromptEvent(contents)
            .setNoCallback(null)
            .setYesCallback(this.handleYesCallback.bind(this)).fire();
    }

    private handleYesCallback(exclude?: CompareStatus[]) {
        const excludeStatuses: CompareStatus[] = exclude ? exclude : [CompareStatus.EQUAL, CompareStatus.NEWER, CompareStatus.MOVED,
            CompareStatus.PENDING_DELETE, CompareStatus.OLDER];
        const deselected: string[] = [];

        this.grid.getSelectedDataList().forEach((content: ContentSummaryAndCompareStatus) => {
            if (excludeStatuses.indexOf(content.getCompareStatus()) < 0) {
                deselected.push(content.getId());
            }
        });

        this.grid.deselectNodes(deselected);
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && state.hasAnyDeletable() &&
               state.canDelete();
    }
}
