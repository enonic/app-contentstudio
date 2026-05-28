import {showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getCurrentItemsAsCSCS} from '../../../v6/features/store/contentTreeSelection.store';
import {EditContentEvent} from '../../event/EditContentEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {type ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class EditContentAction
    extends ContentTreeGridAction {

    private static MAX_ITEMS_TO_EDIT: number = 50;

    constructor() {
        super(i18n('action.edit'), 'mod+e');

        this.setEnabled(false).setClass('edit');
    }

    protected handleExecuted() {
        const contents = [...getCurrentItemsAsCSCS()];

        if (contents.length > EditContentAction.MAX_ITEMS_TO_EDIT) {
            showWarning(i18n('notify.edit.tooMuch'));
        } else if (contents.length > 0) {
            new EditContentEvent(contents).fire();
        }
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && state.hasAnyEditable();
    }

    updateLabel(state: ContentTreeGridItemsState) {
        this.setLabel(this.getLabelByState(state));
    }

    private getLabelByState(state: ContentTreeGridItemsState): string {
        if (state.hasAllReadOnly()) {
            return i18n('action.open');
        }

        return i18n('action.edit');
    }

    resetLabel() {
        this.setLabel(i18n('action.edit'));
    }
}
