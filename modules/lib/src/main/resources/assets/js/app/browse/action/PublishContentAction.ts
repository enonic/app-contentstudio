import {ContentPublishPromptEvent} from '../ContentPublishPromptEvent';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class PublishContentAction extends ContentTreeGridAction {

    private includeChildItems: boolean = false;

    constructor(grid: ContentTreeGrid, includeChildItems: boolean = false, useShortcut: boolean = true) {
        super(grid, i18n('action.publishMore'), useShortcut ? 'ctrl+alt+p' : null);
        this.setEnabled(false);
        this.includeChildItems = includeChildItems;
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = this.grid.getSelectedDataList();
        new ContentPublishPromptEvent({model: contents, includeChildItems: this.includeChildItems}).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && state.canPublish() &&
               ((!state.hasAllOnline() && state.hasValidNonOnline()) || state.hasAllPendingDelete()) &&
               (state.canModify() || !state.hasAnyInProgress());
    }
}
