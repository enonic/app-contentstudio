import {NavigatedAppPanel} from 'lib-admin-ui/app/NavigatedAppPanel';
import {SettingsBrowsePanel} from './browse/SettingsBrowsePanel';
import {SettingsAppBar} from './SettingsAppBar';
import {NewProjectEvent} from './event/NewProjectEvent';
import {AppBarTabId} from 'lib-admin-ui/app/bar/AppBarTabId';
import {AppBarTabMenuItem, AppBarTabMenuItemBuilder} from 'lib-admin-ui/app/bar/AppBarTabMenuItem';
import {ProjectWizardPanel} from './wizard/ProjectWizardPanel';
import {ContentUnnamed} from 'lib-admin-ui//content/ContentUnnamed';
import {i18n} from 'lib-admin-ui/util/Messages';
import {TabMenuItem} from 'lib-admin-ui/ui/tab/TabMenuItem';
import {EditSettingsItemEvent} from './event/EditSettingsItemEvent';
import {SettingsDataItemWizardPanel} from './wizard/SettingsDataItemWizardPanel';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {SettingsServerEvent} from './event/SettingsServerEvent';
import {ProjectGetRequest} from './resource/ProjectGetRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {Project} from './data/project/Project';
import {SettingsViewItem} from './view/SettingsViewItem';
import {SettingsDataViewItem} from './view/SettingsDataViewItem';
import {ProjectViewItem} from './view/ProjectViewItem';

export class SettingsAppPanel
    extends NavigatedAppPanel<SettingsViewItem> {

    protected browsePanel: SettingsBrowsePanel;

    constructor(appBar: SettingsAppBar) {
        super(appBar);
    }

    protected createBrowsePanel(): SettingsBrowsePanel {
        return new SettingsBrowsePanel();
    }

    protected handleGlobalEvents() {
        super.handleGlobalEvents();

        NewProjectEvent.on(() => {
            this.handleNewProject();
        });

        EditSettingsItemEvent.on((event: EditSettingsItemEvent) => {
            this.handleItemEdit(event.getItems());
        });

        SettingsServerEvent.on((event: SettingsServerEvent) => {
            if (!this.browsePanel) {
                return;
            }

            if (event.isCreateEvent()) {
                this.handleItemsCreated(event.getItemsIds());
                return;
            }

            if (event.isUpdateEvent()) {
                this.handleItemsUpdated(event.getItemsIds());
                return;
            }

            if (event.isDeleteEvent()) {
                this.handleItemsDeleted(event.getItemsIds());
                return;
            }
        });
    }

    handleBrowse() {
        super.handleBrowse();
        this.getAppBarTabMenu().deselectNavigationItem();
    }

    getWizardPanelFor(item: SettingsViewItem, tabId: AppBarTabId): SettingsDataItemWizardPanel<SettingsDataViewItem<any>> {
        if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem)) {
            return new ProjectWizardPanel({tabId, persistedItem: <ProjectViewItem>item});
        }

        return null;
    }

    private handleNewProject() {
        const tabId: AppBarTabId = AppBarTabId.forNew('project');
        const tabMenuItem: AppBarTabMenuItem = this.getAppBarTabMenu().getNavigationItemById(tabId);

        if (tabMenuItem != null) {
            this.selectPanel(tabMenuItem);
        } else {
            const unnamedTabMenuText: string = ContentUnnamed.prettifyUnnamed(i18n('settings.items.type.project'));
            const wizard: ProjectWizardPanel = new ProjectWizardPanel({tabId});
            const newTabMenuItem: AppBarTabMenuItem = new AppBarTabMenuItemBuilder()
                .setLabel(unnamedTabMenuText)
                .setTabId(wizard.getTabId())
                .setCloseAction(wizard.getCloseAction())
                .build();

            this.addWizardPanel(newTabMenuItem, wizard);

            wizard.onWizardHeaderNameUpdated((name: string) => {
                newTabMenuItem.setLabel(!!name ? name : unnamedTabMenuText);
            });

            wizard.onNewItemSaved((item: SettingsViewItem) => {
                newTabMenuItem.setTabId(AppBarTabId.forEdit(item.getId()));
                newTabMenuItem.setLabel(item.getDisplayName());
            });
        }
    }

    private handleItemEdit(items: SettingsViewItem[]) {
        items.forEach((item: SettingsViewItem) => {
            const tabId: AppBarTabId = AppBarTabId.forEdit(item.getId());
            const tabMenuItem: TabMenuItem = this.getAppBarTabMenu().getNavigationItemById(tabId);

            if (tabMenuItem != null) {
                this.selectPanel(tabMenuItem);
            } else {
                const unnamedTabMenuText: string = ContentUnnamed.prettifyUnnamed();
                const wizard: SettingsDataItemWizardPanel<SettingsDataViewItem<any>> = this.getWizardPanelFor(item, tabId);
                const newTabMenuItem: AppBarTabMenuItem = new AppBarTabMenuItemBuilder()
                    .setLabel(item.getDisplayName())
                    .setTabId(wizard.getTabId())
                    .setCloseAction(wizard.getCloseAction())
                    .build();

                this.addWizardPanel(newTabMenuItem, wizard);

                wizard.onWizardHeaderNameUpdated((name: string) => {
                    newTabMenuItem.setLabel(!!name ? name : unnamedTabMenuText);
                });
            }
        });
    }

    private handleItemsCreated(itemsIds: string[]) {
        itemsIds.forEach(this.handleItemCreated.bind(this));
    }

    private handleItemCreated(itemId: string) {
        new ProjectGetRequest(itemId).sendAndParse()
            .then((project: Project) => {
                this.browsePanel.addSettingsItem(ProjectViewItem.create()
                    .setData(project)
                    .build());
            })
            .catch(DefaultErrorHandler.handle);
    }

    private handleItemsUpdated(itemsIds: string[]) {
        itemsIds.forEach(this.handleItemUpdated.bind(this));
    }

    private handleItemUpdated(itemId: string) {
        const isBrowsePanelItemUpdated: boolean = this.browsePanel.hasItemWithId(itemId);
        const isAnyWizardPanelUpdated: boolean = this.isAnyWizardPanelUpdated(itemId);

        if (!isBrowsePanelItemUpdated && !isAnyWizardPanelUpdated) {
            return;
        }

        new ProjectGetRequest(itemId).sendAndParse()
            .then((project: Project) => {

                const item: ProjectViewItem = ProjectViewItem.create()
                    .setData(project)
                    .build();

                if (isAnyWizardPanelUpdated) {
                    this.updateTabLabel(AppBarTabId.forEdit(itemId), item.getDisplayName());
                    this.getPanels()
                        .filter(this.isSettingsItemWizardPanel)
                        .filter((panel: SettingsDataItemWizardPanel<SettingsDataViewItem<any>>) => {
                            return panel.hasPersistedItemWithId(itemId);
                        })
                        .forEach((panel: SettingsDataItemWizardPanel<SettingsDataViewItem<any>>) => {
                            panel.updatePersistedSettingsDataItem(item);
                        });
                }

                if (isBrowsePanelItemUpdated) {
                    this.browsePanel.updateSettingsItem(item);
                }

            })
            .catch(DefaultErrorHandler.handle);

    }

    private isSettingsItemWizardPanel(panel: Panel): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(panel, SettingsDataItemWizardPanel);
    }

    private isAnyWizardPanelUpdated(id: string): boolean {
        return this.getPanels().filter(this.isSettingsItemWizardPanel).some(
            (panel: SettingsDataItemWizardPanel<SettingsDataViewItem<any>>) => {
                return panel.hasPersistedItemWithId(id);
            });
    }

    private updateTabLabel(tabId: AppBarTabId, label: string) {
        const tabMenuItem: TabMenuItem = this.getAppBarTabMenu().getNavigationItemById(tabId);
        if (!tabMenuItem) {
            return;
        }

        tabMenuItem.setLabel(label);
    }

    private handleItemsDeleted(itemsIds: string[]) {
        itemsIds.forEach(this.handleItemDeleted.bind(this));
    }

    private handleItemDeleted(itemId: string) {
        this.browsePanel.deleteSettingsItem(itemId);

        this.getPanels()
            .filter(this.isSettingsItemWizardPanel)
            .filter((panel: SettingsDataItemWizardPanel<SettingsDataViewItem<any>>) => {
                return panel.hasPersistedItemWithId(itemId);
            })
            .forEach((panel: SettingsDataItemWizardPanel<SettingsDataViewItem<any>>) => {
                return panel.close();
            });
    }

}
