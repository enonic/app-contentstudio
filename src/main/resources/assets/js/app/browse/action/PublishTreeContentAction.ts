import {PublishContentAction} from './PublishContentAction';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class PublishTreeContentAction extends PublishContentAction {

    constructor(grid: ContentTreeGrid) {
        super(grid, true, false);

        this.setLabel(i18n('action.publishTreeMore'));
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && state.canPublish() && !state.hasAllLeafs() &&
               !state.hasAnyPendingDelete() &&
               (state.canModify() || !state.hasAnyInProgress());
    }
}
