import {BrowsePanel} from '@enonic/lib-admin-ui/app/browse/BrowsePanel';
import {SettingsItemsTreeGrid} from '../grid/SettingsItemsTreeGrid';
import {SettingsBrowseToolbar} from './SettingsBrowseToolbar';
import {SettingsBrowseItemPanel} from './SettingsBrowseItemPanel';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {SettingsItemsTreeGridHighlightEvent} from '../../event/SettingsItemsTreeGridHighlightEvent';
import {SelectableListBoxPanel} from '@enonic/lib-admin-ui/ui/panel/SelectableListBoxPanel';
import {ListBoxToolbar} from '@enonic/lib-admin-ui/ui/selector/list/ListBoxToolbar';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {SettingsTreeList, SettingsTreeListElement} from '../SettingsTreeList';
import {Projects} from '../resource/Projects';
import {SettingsTreeActions} from '../tree/SettingsTreeActions';
import {TreeGridContextMenu} from '@enonic/lib-admin-ui/ui/treegrid/TreeGridContextMenu';
import * as Q from 'q';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';

export class SettingsBrowsePanel
    extends BrowsePanel {

    protected treeGrid: SettingsItemsTreeGrid;

    protected treeListBox: SettingsTreeList;

    protected toolbar: ListBoxToolbar<SettingsViewItem>;

    protected treeActions: SettingsTreeActions;

    protected contextMenu: TreeGridContextMenu;

    protected selectableListBoxPanel: SelectableListBoxPanel<SettingsViewItem>;

    protected initListeners(): void {
        super.initListeners();

        this.treeGrid.onLoaded(this.updateBrowseActions.bind(this));
        this.treeGrid.onHighlightingChanged(
            () => this.treeGrid.hasHighlightedNode() && new SettingsItemsTreeGridHighlightEvent(this.treeGrid.getHighlightedItem()).fire()
        );

        this.treeListBox.onItemsAdded((items: SettingsViewItem[]) => {
            items.forEach((item: SettingsViewItem) => {
                const listElement = this.treeListBox.getDataView(item) as SettingsTreeListElement;

                listElement?.onDblClicked(() => {
                    this.treeActions.getEditAction().execute();
                });

                listElement?.onContextMenu((event: MouseEvent) => {
                    event.preventDefault();
                    this.contextMenu.showAt(event.clientX, event.clientY);
                });
            });
        });

        Projects.get().onProjectsUpdated(() => this.treeListBox?.reload());
    }

    protected createTreeGrid(): SettingsItemsTreeGrid {
        return new SettingsItemsTreeGrid();
    }

    protected createListBoxPanel(): SelectableListBoxPanel<SettingsViewItem> {
        this.treeListBox = new SettingsTreeList();

        const selectionWrapper = new SelectableListBoxWrapper<SettingsViewItem>(this.treeListBox, {
            className: 'settings-list-box-wrapper',
            maxSelected: 0,
            checkboxPosition: 'left',
            highlightMode: true,
        });

        this.treeActions = new SettingsTreeActions(selectionWrapper);
        this.contextMenu = new TreeGridContextMenu(this.treeActions);
        this.toolbar = new ListBoxToolbar<SettingsViewItem>(selectionWrapper, {
            refreshAction: () => this.treeListBox.reload(),
        });

        this.toolbar.getSelectionPanelToggler().hide();

        return new SelectableListBoxPanel(selectionWrapper, this.toolbar);
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
        return this.treeGrid.hasItemWithId(id);
    }

    addSettingsItem(item: SettingsViewItem) {
        this.treeGrid.appendSettingsItemNode(item);
    }

    updateSettingsItem(item: SettingsViewItem) {
        this.treeGrid.updateNodeByData(item);
    }

    deleteSettingsItem(id: string) {
        this.treeGrid.deleteSettingsItem(id);
    }

    hasItemsLoaded(): boolean {
        return this.treeGrid.getFullTotal() > 1;
    }

    hasChildren(id: string): boolean {
        const item: SettingsViewItem = this.treeGrid.getItemById(id);

        return !!item && this.treeGrid.hasChildren(item);
    }

    getItemById(id: string): SettingsViewItem {
        return this.selectableListBoxPanel ? this.selectableListBoxPanel.getItem(id) : this.treeGrid.getItemById(id);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('settings-browse-panel');

            return rendered;
        });
    }

}
