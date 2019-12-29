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
        return Q(null);
    }

}
