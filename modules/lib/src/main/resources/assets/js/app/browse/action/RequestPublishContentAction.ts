import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getSelectedItems} from '../../../v6/features/store/contentTreeSelectionStore';
import {ContentTreeListElement2} from '../../../v6/features/views/browse/grid/ContentTreeListElement2';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {RequestContentPublishPromptEvent} from '../RequestContentPublishPromptEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class RequestPublishContentAction
    extends ContentTreeGridAction {

    constructor(grid: ContentTreeListElement2) {
        super(grid, i18n('action.requestPublish'));

        this.setEnabled(false).setClass('request-publish');
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = getSelectedItems();
        new RequestContentPublishPromptEvent(contents).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && state.hasAllValid();
    }
}
