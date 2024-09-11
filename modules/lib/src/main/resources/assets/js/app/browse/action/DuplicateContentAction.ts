import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentDuplicatePromptEvent} from '../ContentDuplicatePromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class DuplicateContentAction
    extends ContentTreeGridAction {

    constructor(grid: ContentTreeGrid) {
        super(grid, i18n('action.duplicateMore'));

        this.setEnabled(false).setClass('duplicate');
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = this.grid.getSelectedDataList();

        new ContentDuplicatePromptEvent(contents)
            .setYesCallback(() => {
                const deselected = this.grid.getSelectedDataList().map(content => content.getId());
                this.grid.deselectNodes(deselected);
            }).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && state.canCreate();
    }
}
