import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getSelectedItems} from '../../../v6/features/store/contentTreeSelectionStore';
import {ContentTreeListElement} from '../../../v6/features/views/browse/grid/ContentTreeListElement';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentUnpublishPromptEvent} from '../ContentUnpublishPromptEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class UnpublishContentAction extends ContentTreeGridAction {

    constructor(grid: ContentTreeListElement) {
        super(grid, i18n('action.unpublish'));

        this.setEnabled(false).setClass('unpublish');
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = getSelectedItems();
        new ContentUnpublishPromptEvent(contents).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && state.canPublish() && state.hasAnyPublished();
    }
}
