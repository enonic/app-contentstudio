import { BrowsePanel } from '@enonic/lib-admin-ui/app/browse/BrowsePanel';
import { Panel } from '@enonic/lib-admin-ui/ui/panel/Panel';
import { type SelectableListBoxPanel } from '@enonic/lib-admin-ui/ui/panel/SelectableListBoxPanel';
import { ListBoxToolbar } from '@enonic/lib-admin-ui/ui/selector/list/ListBoxToolbar';
import { SelectableListBoxWrapper } from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import { SelectableTreeListBoxKeyNavigator } from '@enonic/lib-admin-ui/ui/selector/list/SelectableTreeListBoxKeyNavigator';
import type Q from 'q';
import { reloadProjects } from '../../../v6/entities/project/projects.store';
import { getSettingsItem, hasSettingsItem } from '../../../v6/pages/settings/model/settings-tree.store';
import { SettingsItemPanelElement } from '../../../v6/pages/settings/ui/item-panel/SettingsItemPanelElement';
import { SettingsLayoutElement } from '../../../v6/pages/settings/ui/layout/SettingsLayout';
import { SettingsTreeListElement } from '../../../v6/pages/settings/ui/SettingsTreeListElement';
import { SettingsBrowseToolbarElement } from '../../../v6/widgets/browse-toolbar/SettingsBrowseToolbar';
import { SettingsTreeList } from '../SettingsTreeList';
import { SettingsTreeActions } from '../tree/SettingsTreeActions';
import { type SettingsViewItem } from '../view/SettingsViewItem';
import { SettingsBrowseToolbar } from './SettingsBrowseToolbar';
import { SettingsTreeListSelectablePanelProxy } from './SettingsTreeListSelectablePanelProxy';

export class SettingsBrowsePanel extends BrowsePanel {
    protected treeListBox: SettingsTreeList;
    private settingsTreeList: SettingsTreeListElement;

    protected toolbar: ListBoxToolbar<SettingsViewItem>;

    declare protected treeActions: SettingsTreeActions;

    protected selectionWrapper: SelectableListBoxWrapper<SettingsViewItem>;

    declare protected selectableListBoxPanel: SelectableListBoxPanel<SettingsViewItem>;

    private settingsLayout: SettingsLayoutElement;

    // Bypasses BrowsePanel splits: placement is owned by the v6 SettingsLayout.
    protected initElements(): void {
        this.selectableListBoxPanel = this.createListBoxPanel();
        this.keyNavigator = this.createKeyNavigator();
        this.browseToolbar = this.createToolbar();

        if (!this.browseItemPanel) {
            this.browseItemPanel = this.createBrowseItemPanel();
        }

        this.settingsLayout = new SettingsLayoutElement({
            gridPanel: this.selectableListBoxPanel,
            itemPanel: this.browseItemPanel,
        });

        this.selectableListBoxPanel.getWrapper().setSkipFirstClickOnFocus(true);

        this.prependChild(new SettingsBrowseToolbarElement(this.treeActions));
        this.settingsTreeList.setContextMenuActions(this.treeActions.getAllActions());
    }

    protected togglePreviewPanelDependingOnScreenSize(): void {
        // Item panel visibility is owned by SettingsLayout.
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

    // Bypasses BrowsePanel.doRender.
    doRender(): Q.Promise<boolean> {
        return Panel.prototype.doRender.call(this).then(() => {
            this.browseToolbar.addClass('browse-toolbar');
            this.appendChild(this.browseToolbar);
            this.appendChild(this.settingsLayout);
            this.addClass('settings-browse-panel');

            return true;
        });
    }
}
