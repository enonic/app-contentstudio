import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getCurrentItemsAsCSCS} from '../../../v6/features/store/contentTreeSelection.store';
import {CreateIssuePromptEvent} from '../CreateIssuePromptEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {type ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class CreateIssueAction extends ContentTreeGridAction {

    constructor() {
        super(i18n('action.createIssue'));

        this.setEnabled(false).setClass('create-issue');
    }

    protected handleExecuted() {
        new CreateIssuePromptEvent([...getCurrentItemsAsCSCS()]).fire();
    }

    isToBeEnabled(_state: ContentTreeGridItemsState): boolean {
        return true;
    }
}
