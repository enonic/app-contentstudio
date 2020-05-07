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
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {Project} from './data/project/Project';
import {SettingsViewItem} from './view/SettingsViewItem';
import {SettingsDataViewItem} from './view/SettingsDataViewItem';
import {ProjectViewItem} from './view/ProjectViewItem';
import {ProjectUpdatedEvent} from './event/ProjectUpdatedEvent';
import {ProjectDeletedEvent} from './event/ProjectDeletedEvent';
import {ProjectListRequest} from './resource/ProjectListRequest';

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

        ProjectDeletedEvent.on((event: ProjectDeletedEvent) => {
            if (!this.browsePanel) {
                return;
            }

            this.handleItemDeleted(event.getProjectName());
        });


        ProjectUpdatedEvent.on((event: ProjectUpdatedEvent) => {
            if (!this.browsePanel) {
                return;
            }

            this.handleItemUpdated(event.getProjectName());
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

    private handleItemUpdated(projectName: string) {
        new ProjectListRequest().sendAndParse()
            .then((projects: Project[]) => {

                const changedProjects = projects.filter(project => project.getName() === projectName);

                const projectExistsAndAccessGranted: boolean = changedProjects.length > 0;
                const isItemPresentInBrowsePanel: boolean = this.browsePanel.hasItemWithId(projectName);

                if (projectExistsAndAccessGranted) {
                    if (!isItemPresentInBrowsePanel) {
                        this.browsePanel.addSettingsItem(ProjectViewItem.create().setData(changedProjects[0]).build());
                    } else {
                        const item: ProjectViewItem = ProjectViewItem.create()
                            .setData(changedProjects[0])
                            .build();

                        this.browsePanel.updateSettingsItem(item);

                        const wizardPanelToUpdate: SettingsDataItemWizardPanel<any> = <SettingsDataItemWizardPanel<any>>this.getPanels()
                            .filter(this.isSettingsItemWizardPanel)
                            .find((panel: SettingsDataItemWizardPanel<any>) => panel.hasPersistedItemWithId(projectName));

                        if (wizardPanelToUpdate) {
                            this.updateTabLabel(AppBarTabId.forEdit(projectName), item.getDisplayName());
                            wizardPanelToUpdate.updatePersistedSettingsDataItem(item);
                        }
                    }
                } else {
                    if (isItemPresentInBrowsePanel) {
                        this.browsePanel.deleteSettingsItem(projectName);
                    }
                }
            }).catch(DefaultErrorHandler.handle);
    }

    private isSettingsItemWizardPanel(panel: Panel): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(panel, SettingsDataItemWizardPanel);
    }

    private updateTabLabel(tabId: AppBarTabId, label: string) {
        const tabMenuItem: TabMenuItem = this.getAppBarTabMenu().getNavigationItemById(tabId);
        if (!tabMenuItem) {
            return;
        }

        tabMenuItem.setLabel(label);
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
