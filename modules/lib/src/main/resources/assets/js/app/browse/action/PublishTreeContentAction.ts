import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {PublishContentAction} from './PublishContentAction';
import {type SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';

export class PublishTreeContentAction extends PublishContentAction {

    constructor() {
        super(true, false);

        this.setClass('publish-tree').setLabel(i18n('action.publishTree'));
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && state.canPublish() && !state.hasAllLeafs() &&
               (state.canModify() || !state.hasAnyInProgress());
    }
}
