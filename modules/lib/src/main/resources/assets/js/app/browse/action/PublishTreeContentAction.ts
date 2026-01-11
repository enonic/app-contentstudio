import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {PublishContentAction} from './PublishContentAction';

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
