import {BrowsePanel} from '@enonic/lib-admin-ui/app/browse/BrowsePanel';
import {SettingsBrowseToolbar} from './SettingsBrowseToolbar';
import {SettingsBrowseItemPanel} from './SettingsBrowseItemPanel';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {SelectableListBoxPanel} from '@enonic/lib-admin-ui/ui/panel/SelectableListBoxPanel';
import {ListBoxToolbar} from '@enonic/lib-admin-ui/ui/selector/list/ListBoxToolbar';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {SettingsTreeList} from '../SettingsTreeList';
import {SettingsTreeActions} from '../tree/SettingsTreeActions';
import Q from 'q';
import {SelectableTreeListBoxKeyNavigator} from '@enonic/lib-admin-ui/ui/selector/list/SelectableTreeListBoxKeyNavigator';
import {ProjectViewItem} from '../view/ProjectViewItem';
import {SettingsBrowseToolbarElement} from '../../../v6/features/views/browse/toolbar/SettingsBrowseToolbar';
import {SettingsTreeListElement} from '../../../v6/features/views/browse/settings/SettingsTreeListElement';
import {SettingsTreeListSelectablePanelProxy} from './SettingsTreeListSelectablePanelProxy';
import {getSettingsItem, hasSettingsItem} from '../../../v6/features/store/settings-tree.store';
import {removeProject, upsertProject, reloadProjects} from '../../../v6/features/store/projects.store';

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

    protected initListeners(): void {
        super.initListeners();

        // no-op: React tree list handles row events and context menu
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

    protected createBrowseItemPanel(): SettingsBrowseItemPanel {
        return new SettingsBrowseItemPanel();
    }

    protected getBrowseActions(): SettingsTreeActions {
        return this.treeActions;
    }

    hasItemWithId(id: string) {
        return hasSettingsItem(id);
    }

    addSettingsItem(item: ProjectViewItem) {
        upsertProject(item.getData());
    }

    updateSettingsItem(item: ProjectViewItem) {
        upsertProject(item.getData());
    }

    deleteSettingsItem(id: string) {
        removeProject(id);
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
