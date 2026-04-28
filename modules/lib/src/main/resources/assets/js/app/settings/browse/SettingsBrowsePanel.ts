import {BrowsePanel} from '@enonic/lib-admin-ui/app/browse/BrowsePanel';
import {type SelectableListBoxPanel} from '@enonic/lib-admin-ui/ui/panel/SelectableListBoxPanel';
import {ListBoxToolbar} from '@enonic/lib-admin-ui/ui/selector/list/ListBoxToolbar';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {SelectableTreeListBoxKeyNavigator} from '@enonic/lib-admin-ui/ui/selector/list/SelectableTreeListBoxKeyNavigator';
import type Q from 'q';
import {reloadProjects} from '../../../v6/features/store/projects.store';
import {getSettingsItem, hasSettingsItem} from '../../../v6/features/store/settings-tree.store';
import {SettingsItemPanelElement} from '../../../v6/features/views/browse/settings/item-panel/SettingsItemPanelElement';
import {SettingsTreeListElement} from '../../../v6/features/views/browse/settings/SettingsTreeListElement';
import {SettingsBrowseToolbarElement} from '../../../v6/features/views/browse/toolbar/SettingsBrowseToolbar';
import {SettingsTreeList} from '../SettingsTreeList';
import {SettingsTreeActions} from '../tree/SettingsTreeActions';
import {type SettingsViewItem} from '../view/SettingsViewItem';
import {SettingsBrowseToolbar} from './SettingsBrowseToolbar';
import {SettingsTreeListSelectablePanelProxy} from './SettingsTreeListSelectablePanelProxy';

export class SettingsBrowsePanel
    extends BrowsePanel {

    protected treeListBox: SettingsTreeList;
    private settingsTreeList: SettingsTreeListElement;

    protected toolbar: ListBoxToolbar<SettingsViewItem>;

    declare protected treeActions: SettingsTreeActions;

    protected selectionWrapper: SelectableListBoxWrapper<SettingsViewItem>;

    declare protected selectableListBoxPanel: SelectableListBoxPanel<SettingsViewItem>;

    protected initElements(): void {
        super.initElements();

        this.prependChild(new SettingsBrowseToolbarElement(this.treeActions));
        this.settingsTreeList.setContextMenuActions(this.treeActions.getAllActions());
    }

    protected createListBoxPanel(): SelectableListBoxPanel<SettingsViewItem> {
        this.treeListBox = new SettingsTreeList();

        this.selectionWrapper = new SelectableListBoxWrapper<SettingsViewItem>(this.treeListBox, {
            className: 'settings-list-box-wrapper',
            maxSelected: 0,
            checkboxPosition: 'left',
            highlightMode: true,
        });


        this.treeActions = new SettingsTreeActions();
        this.toolbar = new ListBoxToolbar<SettingsViewItem>(this.selectionWrapper, {
            refreshAction: () => reloadProjects(),
        });

        this.toolbar.hideAndDisableSelectionToggler();

        this.settingsTreeList = new SettingsTreeListElement();
        return new SettingsTreeListSelectablePanelProxy(this.selectionWrapper, this.settingsTreeList, this.toolbar);
    }

    protected createKeyNavigator(): SelectableTreeListBoxKeyNavigator<SettingsViewItem> {
        return new SelectableTreeListBoxKeyNavigator(this.selectionWrapper);
    }

    protected createToolbar(): SettingsBrowseToolbar {
        return new SettingsBrowseToolbar(this.treeActions);
    }

    protected createBrowseItemPanel(): SettingsItemPanelElement {
        return new SettingsItemPanelElement();
    }

    protected getBrowseActions(): SettingsTreeActions {
        return this.treeActions;
    }

    hasItemWithId(id: string) {
        return hasSettingsItem(id);
    }

    getItemById(id: string): SettingsViewItem | undefined {
        return getSettingsItem(id);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('settings-browse-panel');

            return rendered;
        });
    }

}
