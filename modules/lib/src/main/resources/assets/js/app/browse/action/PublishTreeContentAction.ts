import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentTreeListElement2} from '../../../v6/features/views/browse/grid/ContentTreeListElement2';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {PublishContentAction} from './PublishContentAction';

export class PublishTreeContentAction extends PublishContentAction {

    constructor(grid: ContentTreeListElement2) {
        super(grid, true, false);

        this.setClass('publish-tree').setLabel(i18n('action.publishTree'));
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && state.canPublish() && !state.hasAllLeafs() &&
               (state.canModify() || !state.hasAnyInProgress());
    }
}
