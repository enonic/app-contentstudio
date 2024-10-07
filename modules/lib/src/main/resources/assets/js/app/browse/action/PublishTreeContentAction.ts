import {PublishContentAction} from './PublishContentAction';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';

export class PublishTreeContentAction extends PublishContentAction {

    constructor(grid: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>) {
        super(grid, true, false);

        this.setClass('publish-tree').setLabel(i18n('action.publishTreeMore'));
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && state.canPublish() && !state.hasAllLeafs() &&
               !state.hasAnyPendingDelete() &&
               (state.canModify() || !state.hasAnyInProgress());
    }
}
