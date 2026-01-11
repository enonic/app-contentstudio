import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getCurrentItems} from '../../../v6/features/store/contentTreeSelection.store';
import {ContentMovePromptEvent} from '../../move/ContentMovePromptEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class MoveContentAction
    extends ContentTreeGridAction {

    constructor() {
        super(i18n('action.move'), 'alt+m');

        this.setEnabled(false).setClass('move');
    }

    protected handleExecuted() {
        const contents = getCurrentItems().map(content => content.getContentSummary());
        new ContentMovePromptEvent(contents).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && this.isAnyRootItemNotSelected() && state.canDelete();
    }

    private isAnyRootItemNotSelected(): boolean {
        return getCurrentItems().length > 0;
    }
}
