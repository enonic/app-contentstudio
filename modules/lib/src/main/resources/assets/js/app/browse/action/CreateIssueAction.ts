import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getSelectedItems} from '../../../v6/features/store/contentTreeSelectionStore';
import {ContentTreeListElement} from '../../../v6/features/views/browse/grid/ContentTreeListElement';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {CreateIssuePromptEvent} from '../CreateIssuePromptEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class CreateIssueAction extends ContentTreeGridAction {

    constructor(grid: ContentTreeListElement) {
        super(grid, i18n('action.createIssue'));

        this.setEnabled(false).setClass('create-issue');
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = getSelectedItems();
        new CreateIssuePromptEvent(contents).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !getSelectedItems().some(item => item.hasUploadItem());
    }
}
