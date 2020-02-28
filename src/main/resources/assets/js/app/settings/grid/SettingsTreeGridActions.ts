import * as Q from 'q';
import {TreeGridActions} from 'lib-admin-ui/ui/treegrid/actions/TreeGridActions';
import {BrowseItem} from 'lib-admin-ui/app/browse/BrowseItem';
import {BrowseItemsChanges} from 'lib-admin-ui/app/browse/BrowseItemsChanges';
import {Action} from 'lib-admin-ui/ui/Action';
import {SettingsItemsTreeGrid} from './SettingsItemsTreeGrid';
import {NewSettingsItemAction} from '../browse/action/NewSettingsItemAction';
import {EditSettingsItemAction} from '../browse/action/EditSettingsItemAction';
import {DeleteSettingsItemAction} from '../browse/action/DeleteSettingsItemAction';
import {IsAuthenticatedRequest} from 'lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';
import {SettingsViewItem} from '../view/SettingsViewItem';

export class SettingsTreeGridActions
    implements TreeGridActions<SettingsViewItem> {

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

    updateActionsEnabledState(browseItems: BrowseItem<SettingsViewItem>[], changes?: BrowseItemsChanges<any>): Q.Promise<void> {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            const selectedItems: SettingsViewItem[] = browseItems.map((browseItem: BrowseItem<SettingsViewItem>) => browseItem.getModel());

            this.EDIT.setEnabled(this.isEditAllowed(selectedItems, loginResult));
            this.DELETE.setEnabled(this.isDeleteAllowed(selectedItems, loginResult));
            this.NEW.setEnabled(this.isNewAllowed(selectedItems, loginResult));
        });
    }

    isEditAllowed(selectedItems: SettingsViewItem[], loginResult: LoginResult): boolean {
        return selectedItems.length > 0 ? selectedItems.every((item: SettingsViewItem) => item.isEditAllowed(loginResult)) : false;
    }

    isDeleteAllowed(selectedItems: SettingsViewItem[], loginResult: LoginResult): boolean {
        return selectedItems.length > 0 ? selectedItems.every((item: SettingsViewItem) => item.isDeleteAllowed(loginResult)) : false;
    }

    isNewAllowed(selectedItems: SettingsViewItem[], loginResult: LoginResult): boolean {
        return loginResult.isContentAdmin();
    }
}
