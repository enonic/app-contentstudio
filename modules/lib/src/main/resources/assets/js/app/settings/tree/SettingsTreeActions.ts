import * as Q from 'q';
import {TreeGridActions} from '@enonic/lib-admin-ui/ui/treegrid/actions/TreeGridActions';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {SyncAction} from '../browse/action/SyncAction';
import {SettingsTreeHelper} from './SettingsTreeHelper';
import {NewSettingsItemTreeAction} from '../browse/action/NewSettingsItemTreeAction';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {EditSettingsItemTreeAction} from '../browse/action/EditSettingsItemTreeAction';
import {DeleteSettingsItemTreeAction} from '../browse/action/DeleteSettingsItemTreeAction';
import {SyncTreeAction} from '../browse/action/SyncTreeAction';

export class SettingsTreeActions
    implements TreeGridActions<SettingsViewItem> {

    private readonly NEW: NewSettingsItemTreeAction;
    private readonly EDIT: EditSettingsItemTreeAction;
    private readonly DELETE: DeleteSettingsItemTreeAction;
    private readonly SYNC: SyncTreeAction;

    private actions: Action[] = [];

    constructor(tree: SelectableListBoxWrapper<SettingsViewItem>) {
        this.NEW = new NewSettingsItemTreeAction(tree);
        this.EDIT = new EditSettingsItemTreeAction(tree);
        this.DELETE = new DeleteSettingsItemTreeAction(tree);
        this.SYNC = new SyncTreeAction();

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
        return SettingsTreeHelper.hasChildren(item);
    }

    private isNewAllowed(loginResult: LoginResult): boolean {
        return loginResult.isContentAdmin();
    }

    getSyncAction(): SyncTreeAction {
        return this.SYNC;
    }

    getEditAction(): EditSettingsItemTreeAction {
        return this.EDIT;
    }
}
