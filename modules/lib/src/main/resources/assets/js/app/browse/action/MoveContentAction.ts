import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { getCurrentItems } from '../../../v6/entities/content';
import { openMoveDialog } from '../../../v6/features/move/model/moveDialog.store';
import { ContentTreeGridAction } from './ContentTreeGridAction';
import { type ContentTreeGridItemsState } from './ContentTreeGridItemsState';

export class MoveContentAction extends ContentTreeGridAction {
    constructor() {
        super(i18n('action.move'), 'alt+m');

        this.setEnabled(false).setClass('move');
    }

    protected handleExecuted() {
        openMoveDialog([...getCurrentItems()]);
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return (
            !state.isEmpty() &&
            !state.isManagedActionExecuting() &&
            this.isAnyRootItemNotSelected() &&
            state.canDelete()
        );
    }

    private isAnyRootItemNotSelected(): boolean {
        return getCurrentItems().length > 0;
    }
}
