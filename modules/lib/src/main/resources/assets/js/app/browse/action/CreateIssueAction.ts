import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getCurrentItems} from '../../../v6/features/store/contentTreeSelection.store';
import {CreateIssuePromptEvent} from '../CreateIssuePromptEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class CreateIssueAction extends ContentTreeGridAction {

    constructor() {
        super(i18n('action.createIssue'));

        this.setEnabled(false).setClass('create-issue');
    }

    protected handleExecuted() {
        new CreateIssuePromptEvent([...getCurrentItems()]).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !getCurrentItems().some(item => item.hasUploadItem());
    }
}
