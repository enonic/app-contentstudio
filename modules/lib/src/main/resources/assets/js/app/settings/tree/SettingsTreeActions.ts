import Q from 'q';
import {type TreeGridActions} from '@enonic/lib-admin-ui/ui/treegrid/actions/TreeGridActions';
import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {type SettingsViewItem} from '../view/SettingsViewItem';
import {SettingsTreeHelper} from './SettingsTreeHelper';
import {NewSettingsItemTreeAction} from '../browse/action/NewSettingsItemTreeAction';
import {EditSettingsItemTreeAction} from '../browse/action/EditSettingsItemTreeAction';
import {DeleteSettingsItemTreeAction} from '../browse/action/DeleteSettingsItemTreeAction';
import {SyncTreeAction} from '../browse/action/SyncTreeAction';
import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';
import {getCurrentItems} from '../../../v6/features/store/settingsTreeSelection.store';
import {$noProjectMode, $projects} from '../../../v6/features/store/projects.store';

export class SettingsTreeActions
    implements TreeGridActions<SettingsViewItem> {

    private readonly NEW: NewSettingsItemTreeAction;
    private readonly EDIT: EditSettingsItemTreeAction;
    private readonly DELETE: DeleteSettingsItemTreeAction;
    private readonly SYNC: SyncTreeAction;

    private actions: Action[] = [];

    constructor() {
        this.NEW = new NewSettingsItemTreeAction();
        this.EDIT = new EditSettingsItemTreeAction();
        this.DELETE = new DeleteSettingsItemTreeAction();
        this.SYNC = new SyncTreeAction();

        this.actions.push(this.NEW, this.EDIT, this.DELETE, this.SYNC);

        const refreshActions = () => {
            void this.updateActionsEnabledState([...getCurrentItems()]);
        };

        $projects.subscribe(refreshActions);
        refreshActions();
    }

    getAllActions(): Action[] {
        return this.actions;
    }

    updateActionsEnabledState(items: SettingsViewItem[]): Q.Promise<void> {
        if ($noProjectMode.get()) {
            this.EDIT.setEnabled(false);
            this.DELETE.setEnabled(false);
            this.NEW.setEnabled(this.isNewAllowed());
            this.SYNC.setEnabled(false);
            this.SYNC.setVisible(false);
            return Q();
        }

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
