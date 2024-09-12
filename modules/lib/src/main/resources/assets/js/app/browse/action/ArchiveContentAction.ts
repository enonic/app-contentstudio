import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentDeletePromptEvent} from '../ContentDeletePromptEvent';
import {CompareStatus} from '../../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class ArchiveContentAction extends ContentTreeGridAction {

    constructor(grid: ContentTreeGrid) {
        super(grid, i18n('action.archiveMore'), 'mod+del');

        this.setEnabled(false).setClass('archive');
    }

    protected handleExecuted() {
        new ContentDeletePromptEvent(this.grid.getSelectedDataList()).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && state.hasAnyDeletable() &&
               state.canDelete();
    }
}
