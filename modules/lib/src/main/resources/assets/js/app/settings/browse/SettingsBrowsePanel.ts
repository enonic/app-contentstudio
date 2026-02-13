import {BrowsePanel} from '@enonic/lib-admin-ui/app/browse/BrowsePanel';
import {SettingsBrowseToolbar} from './SettingsBrowseToolbar';
import {SettingsBrowseItemPanel} from './SettingsBrowseItemPanel';
import {type SettingsViewItem} from '../view/SettingsViewItem';
import {SelectableListBoxPanel} from '@enonic/lib-admin-ui/ui/panel/SelectableListBoxPanel';
import {ListBoxToolbar} from '@enonic/lib-admin-ui/ui/selector/list/ListBoxToolbar';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {SettingsTreeList} from '../SettingsTreeList';
import {SettingsTreeActions} from '../tree/SettingsTreeActions';
import {TreeGridContextMenu} from '@enonic/lib-admin-ui/ui/treegrid/TreeGridContextMenu';
import type Q from 'q';
import {Projects} from '../resource/Projects';
import {SelectableTreeListBoxKeyNavigator} from '@enonic/lib-admin-ui/ui/selector/list/SelectableTreeListBoxKeyNavigator';
import {EditSettingsItemEvent} from '../event/EditSettingsItemEvent';
import {type ProjectViewItem} from '../view/ProjectViewItem';
import {SettingsDataViewItem} from '../view/SettingsDataViewItem';

export class SettingsBrowsePanel
    extends BrowsePanel {

    protected treeListBox: SettingsTreeList;

    protected toolbar: ListBoxToolbar<SettingsViewItem>;

    declare protected treeActions: SettingsTreeActions;

    protected contextMenu: TreeGridContextMenu;

    protected selectionWrapper: SelectableListBoxWrapper<SettingsViewItem>;

    declare protected selectableListBoxPanel: SelectableListBoxPanel<SettingsViewItem>;

    protected initListeners(): void {
        super.initListeners();

        this.treeListBox.onItemsAdded((items: SettingsViewItem[]) => {
            items.forEach((item: SettingsViewItem) => {
                const listElement = this.treeListBox.getDataView(item);

                listElement?.onDblClicked(() => {
                    const actualItem  = this.treeListBox.getItem(item.getId());

                    if (actualItem instanceof SettingsDataViewItem) {
                        new EditSettingsItemEvent([actualItem]).fire();
                    }
                });

                listElement?.onContextMenu((event: MouseEvent) => {
                    event.preventDefault();
                    this.contextMenu.showAt(event.clientX, event.clientY);
                });
            });
        });

        let updateTriggered = false;
        // load tree after projects are loaded
        const projectsUpdatedListener = () => {
            if (!updateTriggered) {
                updateTriggered = true;

                this.treeListBox.whenRendered(() => {
                    updateTriggered = false;
                    this.treeListBox.load();
                });
            }

            Projects.get().unProjectsUpdated(projectsUpdatedListener);
        };

        Projects.get().onProjectsUpdated(projectsUpdatedListener);
    }

    protected createListBoxPanel(): SelectableListBoxPanel<SettingsViewItem> {
        this.treeListBox = new SettingsTreeList();

        this.selectionWrapper = new SelectableListBoxWrapper<SettingsViewItem>(this.treeListBox, {
            className: 'settings-list-box-wrapper',
            maxSelected: 0,
            checkboxPosition: 'left',
            highlightMode: true,
        });


        this.treeActions = new SettingsTreeActions(this.selectionWrapper);
        this.contextMenu = new TreeGridContextMenu(this.treeActions);
        this.toolbar = new ListBoxToolbar<SettingsViewItem>(this.selectionWrapper, {
            refreshAction: () => this.treeListBox.load(),
        });

        this.toolbar.getSelectionPanelToggler().hide();

        return new SelectableListBoxPanel(this.selectionWrapper, this.toolbar);
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
        return !!this.treeListBox.getItem(id);
    }

    addSettingsItem(item: ProjectViewItem) {
        this.treeListBox.findParentList(item)?.addItems(item);
    }

    updateSettingsItem(item: ProjectViewItem) {
        this.treeListBox.findParentList(item)?.replaceItems(item);
    }

    deleteSettingsItem(id: string) {
        const item = this.treeListBox.getItem(id) as ProjectViewItem;

        if (item) {
            if (this.selectionWrapper.isItemSelected(item)) {
                this.selectionWrapper.deselect(item);
            }

            this.treeListBox.findParentList(item)?.removeItems(item);
        }
    }

    getItemById(id: string): SettingsViewItem {
        return this.selectableListBoxPanel.getItem(id);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('settings-browse-panel');

            return rendered;
        });
    }

}
