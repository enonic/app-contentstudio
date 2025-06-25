import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getSelectedItems} from '../../../v6/features/store/contentTreeSelectionStore';
import {ContentTreeListElement} from '../../../v6/features/views/browse/grid/ContentTreeListElement';
import {ContentMovePromptEvent} from '../../move/ContentMovePromptEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class MoveContentAction
    extends ContentTreeGridAction {

    constructor(grid: ContentTreeListElement) {
        super(grid, i18n('action.move'), 'alt+m');

        this.setEnabled(false).setClass('move');
    }

    protected handleExecuted() {
        const contents = getSelectedItems().map(content => content.getContentSummary());
        new ContentMovePromptEvent(contents).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return !state.isEmpty() && !state.isManagedActionExecuting() && this.isAnyRootItemNotSelected() && state.canDelete();
    }

    private isAnyRootItemNotSelected(): boolean {
        return getSelectedItems().length > 0;
    }
}
