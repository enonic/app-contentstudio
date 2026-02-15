import {ContentDeletePromptEvent} from '../ContentDeletePromptEvent';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {type ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {type SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';

export class ArchiveContentAction extends ContentTreeGridAction {

    constructor(grid: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>) {
        super(grid, i18n('action.archiveMore'), 'mod+del');

        this.setEnabled(false).setClass('archive');
    }

    protected handleExecuted() {
        new ContentDeletePromptEvent(this.grid.getSelectedItems()).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && state.hasAnyDeletable() &&
               state.canDelete();
    }
}
