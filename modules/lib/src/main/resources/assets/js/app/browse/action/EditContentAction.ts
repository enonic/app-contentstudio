import {ContentTreeGrid} from '../ContentTreeGrid';
import {EditContentEvent} from '../../event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class EditContentAction extends ContentTreeGridAction {

    private static MAX_ITEMS_TO_EDIT: number = 50;

    constructor(grid: ContentTreeGrid) {
        super(grid, i18n('action.edit'), 'mod+e');
        this.setEnabled(false);
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = this.grid.getSelectedDataList();

        if (contents.length > EditContentAction.MAX_ITEMS_TO_EDIT) {
            showWarning(i18n('notify.edit.tooMuch'));
        } else {
            new EditContentEvent(contents).fire();
        }
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && state.hasAnyEditable();
    }

    updateLabel(state: ContentTreeGridItemsState) {
        if (state.hasAllReadOnly()) {
            this.setLabel(i18n('action.open'));
        } else if (state.hasAllInherited()) {
            this.setLabel(i18n('action.translate'));
        } else {
            this.setLabel(i18n('action.edit'));
        }
    }

    resetLabel() {
        this.setLabel(i18n('action.edit'));
    }
}
