import Q from 'q';
import {TreeGridActions} from '@enonic/lib-admin-ui/ui/treegrid/actions/TreeGridActions';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {SettingsTreeHelper} from './SettingsTreeHelper';
import {NewSettingsItemTreeAction} from '../browse/action/NewSettingsItemTreeAction';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {EditSettingsItemTreeAction} from '../browse/action/EditSettingsItemTreeAction';
import {DeleteSettingsItemTreeAction} from '../browse/action/DeleteSettingsItemTreeAction';
import {SyncTreeAction} from '../browse/action/SyncTreeAction';
import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';
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
        this.EDIT.setEnabled(this.isEditAllowed(items));
        this.DELETE.setEnabled(this.isDeleteAllowed(items));
        this.NEW.setEnabled(this.isNewAllowed());

        if (AuthHelper.isAdmin()) {
            this.SYNC.updateState();
        }

        return Q();
    }

    private isEditAllowed(selectedItems: SettingsViewItem[]): boolean {
        return selectedItems.length > 0 ? selectedItems.every((item: SettingsViewItem) => item.isEditAllowed()) : false;
    }

    private isDeleteAllowed(selectedItems: SettingsViewItem[]): boolean {
        return selectedItems.length === 1 ?
               selectedItems.every((item: SettingsViewItem) => !this.itemHasChildren(item) && item.isDeleteAllowed()) : false;
    }

    private itemHasChildren(item: SettingsViewItem): boolean {
        return SettingsTreeHelper.hasChildren(item);
    }

    private isNewAllowed(): boolean {
        return AuthHelper.isContentAdmin();
    }

    getSyncAction(): SyncTreeAction {
        return this.SYNC;
    }

    getEditAction(): EditSettingsItemTreeAction {
        return this.EDIT;
    }
}
