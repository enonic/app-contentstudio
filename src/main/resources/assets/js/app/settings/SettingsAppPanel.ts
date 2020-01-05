import {NavigatedAppPanel} from 'lib-admin-ui/app/NavigatedAppPanel';
import {SettingsBrowsePanel} from './browse/SettingsBrowsePanel';
import {SettingsAppBar} from './SettingsAppBar';
import {ShowBrowsePanelEvent} from 'lib-admin-ui/app/ShowBrowsePanelEvent';
import {SettingsItem} from './data/SettingsItem';
import {NewProjectEvent} from './event/NewProjectEvent';
import {AppBarTabId} from 'lib-admin-ui/app/bar/AppBarTabId';
import {AppBarTabMenuItem, AppBarTabMenuItemBuilder} from 'lib-admin-ui/app/bar/AppBarTabMenuItem';
import {ProjectWizardPanel} from './wizard/ProjectWizardPanel';
import {ContentUnnamed} from 'lib-admin-ui//content/ContentUnnamed';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ProjectItem} from './data/ProjectItem';
import {TabMenuItem} from 'lib-admin-ui/ui/tab/TabMenuItem';
import {EditSettingsItemEvent} from './event/EditSettingsItemEvent';
import {SettingsItemWizardPanel} from './wizard/SettingsItemWizardPanel';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {SettingsServerEvent} from './event/SettingsServerEvent';
import {ProjectGetRequest} from './resource/ProjectGetRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';

export class SettingsAppPanel
    extends NavigatedAppPanel<SettingsItem> {

    protected browsePanel: SettingsBrowsePanel;

    constructor(appBar: SettingsAppBar) {
        super(appBar);

        this.route();
    }

    private route() {
        new ShowBrowsePanelEvent().fire();
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

    protected handleBrowse() {
        super.handleBrowse();

        this.getAppBarTabMenu().deselectNavigationItem();
    }

    private handleNewProject() {
        const tabId: AppBarTabId = AppBarTabId.forNew('project');
        const tabMenuItem: AppBarTabMenuItem = this.getAppBarTabMenu().getNavigationItemById(tabId);

        if (tabMenuItem != null) {
            this.selectPanel(tabMenuItem);
        } else {
            const wizard: ProjectWizardPanel = new ProjectWizardPanel({tabId});
            const newTabMenuItem: AppBarTabMenuItem = new AppBarTabMenuItemBuilder()
                .setLabel(ContentUnnamed.prettifyUnnamed(i18n('settings.items.type.project')))
                .setTabId(wizard.getTabId())
                .setCloseAction(wizard.getCloseAction())
                .build();

            this.addWizardPanel(newTabMenuItem, wizard);

            wizard.onNewItemSaved((item: SettingsItem) => {
                newTabMenuItem.setTabId(AppBarTabId.forEdit(item.getId()));
                newTabMenuItem.setLabel(item.getDisplayName());
            });
        }
    }

    private handleItemEdit(items: SettingsItem[]) {
        items.forEach((item: SettingsItem) => {
            const tabId: AppBarTabId = AppBarTabId.forEdit(item.getId());
            const tabMenuItem: TabMenuItem = this.getAppBarTabMenu().getNavigationItemById(tabId);

            if (tabMenuItem != null) {
                this.selectPanel(tabMenuItem);
            } else {
                const wizard: SettingsItemWizardPanel<SettingsItem> = this.getWizardPanelFor(item, tabId);
                const newTabMenuItem: AppBarTabMenuItem = new AppBarTabMenuItemBuilder()
                    .setLabel(item.getDisplayName())
                    .setTabId(wizard.getTabId())
                    .setCloseAction(wizard.getCloseAction())
                    .build();

                this.addWizardPanel(newTabMenuItem, wizard);
            }
        });
    }

    getWizardPanelFor(item: SettingsItem, tabId: AppBarTabId): SettingsItemWizardPanel<SettingsItem> {
        if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectItem)) {
            return new ProjectWizardPanel({tabId, persistedItem: <ProjectItem>item});
        }

        return null;
    }

    private handleItemsCreated(itemsIds: string[]) {
        itemsIds.forEach(this.handleItemCreated.bind(this));
    }

    private handleItemCreated(itemId: string) {
        new ProjectGetRequest(itemId).sendAndParse()
            .then((item: ProjectItem) => {
                this.browsePanel.addSettingsItem(item);
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
            .then((item: ProjectItem) => {
                if (isAnyWizardPanelUpdated) {
                    this.updateTabLabel(AppBarTabId.forEdit(itemId), item.getDisplayName());
                    this.getPanels()
                        .filter(this.isSettingsItemWizardPanel)
                        .filter((panel: SettingsItemWizardPanel<SettingsItem>) => {
                            return panel.hasPersistedItemWithId(itemId);
                        })
                        .forEach((panel: SettingsItemWizardPanel<SettingsItem>) => {
                            panel.updatePersistedSettingsItem(item);
                        });
                }

                if (isBrowsePanelItemUpdated) {
                    this.browsePanel.updateSettingsItem(item);
                }

            })
            .catch(DefaultErrorHandler.handle);

    }

    private isSettingsItemWizardPanel(panel: Panel): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(panel, SettingsItemWizardPanel);
    }

    private isAnyWizardPanelUpdated(id: string): boolean {
        return this.getPanels().filter(this.isSettingsItemWizardPanel).some((panel: SettingsItemWizardPanel<SettingsItem>) => {
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
            .filter((panel: SettingsItemWizardPanel<SettingsItem>) => {
                return panel.hasPersistedItemWithId(itemId);
            })
            .forEach((panel: SettingsItemWizardPanel<SettingsItem>) => {
                return panel.close();
            });
    }

}
