import {ContentTreeGrid} from '../ContentTreeGrid';
import {CreateIssuePromptEvent} from '../CreateIssuePromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class CreateIssueAction extends ContentTreeGridAction {

    constructor(grid: ContentTreeGrid) {
        super(grid, i18n('action.createTaskMore'));

        this.setEnabled(false);
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = this.grid.getSelectedDataList();
        new CreateIssuePromptEvent(contents).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return true;
    }
}
