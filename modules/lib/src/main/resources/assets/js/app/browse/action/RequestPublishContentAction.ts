import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getCurrentItems} from '../../../v6/features/store/contentTreeSelection.store';
import {RequestContentPublishPromptEvent} from '../RequestContentPublishPromptEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class RequestPublishContentAction
    extends ContentTreeGridAction {

    constructor() {
        super(i18n('action.requestPublish'));

        this.setEnabled(false).setClass('request-publish');
    }

    protected handleExecuted() {
        new RequestContentPublishPromptEvent([...getCurrentItems()]).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && state.hasAllValid();
    }
}
