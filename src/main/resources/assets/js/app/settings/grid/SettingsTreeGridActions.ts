import * as Q from 'q';
import {TreeGridActions} from 'lib-admin-ui/ui/treegrid/actions/TreeGridActions';
import {BrowseItem} from 'lib-admin-ui/app/browse/BrowseItem';
import {BrowseItemsChanges} from 'lib-admin-ui/app/browse/BrowseItemsChanges';
import {Action} from 'lib-admin-ui/ui/Action';
import {SettingsItemsTreeGrid} from './SettingsItemsTreeGrid';
import {NewSettingsItemAction} from '../browse/action/NewSettingsItemAction';
import {EditSettingsItemAction} from '../browse/action/EditSettingsItemAction';
import {DeleteSettingsItemAction} from '../browse/action/DeleteSettingsItemAction';
import {SettingsItem} from '../data/SettingsItem';
import {IsAuthenticatedRequest} from 'lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';

export class SettingsTreeGridActions
    implements TreeGridActions<SettingsItem> {

    private NEW: Action;
    private EDIT: Action;
    private DELETE: Action;

    private actions: Action[] = [];

    constructor(grid: SettingsItemsTreeGrid) {
        this.NEW = new NewSettingsItemAction(grid);
        this.EDIT = new EditSettingsItemAction(grid);
        this.DELETE = new DeleteSettingsItemAction(grid);

        this.actions.push(this.NEW, this.EDIT, this.DELETE);
    }

    getAllActions(): Action[] {
        return this.actions;
    }

    updateActionsEnabledState(browseItems: BrowseItem<SettingsItem>[], changes?: BrowseItemsChanges<any>): Q.Promise<void> {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            const selectedItems: SettingsItem[] = browseItems.map((browseItem: BrowseItem<SettingsItem>) => browseItem.getModel());
            this.EDIT.setEnabled(this.isEditToBeEnabled(selectedItems, loginResult));
            this.DELETE.setEnabled(this.isDeleteToBeEnabled(selectedItems, loginResult));
            this.NEW.setEnabled(this.isNewToBeEnabled(selectedItems, loginResult));
        });
    }

    isEditToBeEnabled(selectedItems: SettingsItem[], loginResult: LoginResult): boolean {
        return selectedItems.every((item: SettingsItem) => item.isEditAllowed(loginResult));
    }

    isDeleteToBeEnabled(selectedItems: SettingsItem[], loginResult: LoginResult): boolean {
        return selectedItems.every((item: SettingsItem) => item.isDeleteAllowed(loginResult));
    }

    isNewToBeEnabled(selectedItems: SettingsItem[], loginResult: LoginResult): boolean {
        return loginResult.isContentAdmin();
    }
}
