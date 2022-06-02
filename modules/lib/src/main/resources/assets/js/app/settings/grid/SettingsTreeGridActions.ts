import * as Q from 'q';
import {TreeGridActions} from '@enonic/lib-admin-ui/ui/treegrid/actions/TreeGridActions';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {SettingsItemsTreeGrid} from './SettingsItemsTreeGrid';
import {NewSettingsItemAction} from '../browse/action/NewSettingsItemAction';
import {EditSettingsItemAction} from '../browse/action/EditSettingsItemAction';
import {DeleteSettingsItemAction} from '../browse/action/DeleteSettingsItemAction';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {SyncAction} from '../browse/action/SyncAction';

export class SettingsTreeGridActions
    implements TreeGridActions<SettingsViewItem> {

    private readonly NEW: Action;
    private readonly EDIT: Action;
    private readonly DELETE: Action;
    private readonly SYNC: SyncAction;
    private readonly grid: SettingsItemsTreeGrid;

    private actions: Action[] = [];

    constructor(grid: SettingsItemsTreeGrid) {
        this.grid = grid;
        this.NEW = new NewSettingsItemAction(grid);
        this.EDIT = new EditSettingsItemAction(grid);
        this.DELETE = new DeleteSettingsItemAction(grid);
        this.SYNC = new SyncAction(grid);

        this.actions.push(this.NEW, this.EDIT, this.DELETE, this.SYNC);
    }

    getAllActions(): Action[] {
        return this.actions;
    }

    updateActionsEnabledState(items: SettingsViewItem[]): Q.Promise<void> {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            this.EDIT.setEnabled(this.isEditAllowed(items, loginResult));
            this.DELETE.setEnabled(this.isDeleteAllowed(items, loginResult));
            this.NEW.setEnabled(this.isNewAllowed(loginResult));

            if (loginResult.isAdmin()) {
                this.SYNC.updateState();
            }
        });
    }

    private isEditAllowed(selectedItems: SettingsViewItem[], loginResult: LoginResult): boolean {
        return selectedItems.length > 0 ? selectedItems.every((item: SettingsViewItem) => item.isEditAllowed(loginResult)) : false;
    }

    private isDeleteAllowed(selectedItems: SettingsViewItem[], loginResult: LoginResult): boolean {
        return selectedItems.length === 1 ?
               selectedItems.every((item: SettingsViewItem) => !this.itemHasChildren(item) && item.isDeleteAllowed(loginResult)) : false;
    }

    private itemHasChildren(item: SettingsViewItem): boolean {
        return this.grid.hasChildren(item);
    }

    private isNewAllowed(loginResult: LoginResult): boolean {
        return loginResult.isContentAdmin();
    }

    getSyncAction(): SyncAction {
        return this.SYNC;
    }

}
