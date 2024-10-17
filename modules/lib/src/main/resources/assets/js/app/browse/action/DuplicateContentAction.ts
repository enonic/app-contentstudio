import {ContentDuplicatePromptEvent} from '../ContentDuplicatePromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';

export class DuplicateContentAction
    extends ContentTreeGridAction {

    constructor(grid: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>) {
        super(grid, i18n('action.duplicateMore'));

        this.setEnabled(false).setClass('duplicate');
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = this.grid.getSelectedItems();

        new ContentDuplicatePromptEvent(contents)
            .setYesCallback(() => {
                this.grid.deselect(this.grid.getSelectedItems());
            }).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && state.canCreate();
    }
}
