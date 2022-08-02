import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';
import {NavigatedAppPanel} from '@enonic/lib-admin-ui/app/NavigatedAppPanel';
import {SettingsBrowsePanel} from './browse/SettingsBrowsePanel';
import {NewProjectEvent} from './event/NewProjectEvent';
import {AppBarTabId} from '@enonic/lib-admin-ui/app/bar/AppBarTabId';
import {AppBarTabMenuItem, AppBarTabMenuItemBuilder} from '@enonic/lib-admin-ui/app/bar/AppBarTabMenuItem';
import {ProjectWizardPanel} from './wizard/panel/ProjectWizardPanel';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {TabMenuItem} from '@enonic/lib-admin-ui/ui/tab/TabMenuItem';
import {EditSettingsItemEvent} from './event/EditSettingsItemEvent';
import {SettingsDataItemWizardPanel} from './wizard/panel/SettingsDataItemWizardPanel';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {Project} from './data/project/Project';
import {SettingsViewItem} from './view/SettingsViewItem';
import {SettingsDataViewItem} from './view/SettingsDataViewItem';
import {ProjectViewItem} from './view/ProjectViewItem';
import {ProjectUpdatedEvent} from './event/ProjectUpdatedEvent';
import {ProjectDeletedEvent} from './event/ProjectDeletedEvent';
import {ProjectSelectionDialog} from './dialog/project/selection/ProjectSelectionDialog';
import {ProjectCreatedEvent} from './event/ProjectCreatedEvent';
import {SettingsTypes} from './data/type/SettingsTypes';
import {ProjectGetRequest} from './resource/ProjectGetRequest';
import {ContentAppBar} from '../bar/ContentAppBar';

export class SettingsAppPanel
    extends NavigatedAppPanel {

    protected browsePanel: SettingsBrowsePanel;

    private deletedIds: string[] = [];

    constructor() {
        super(ContentAppBar.getInstance());
    }

    protected createBrowsePanel(): SettingsBrowsePanel {
        return new SettingsBrowsePanel();
    }

    protected handleGlobalEvents() {
        super.handleGlobalEvents();

        NewProjectEvent.on((event: NewProjectEvent) => {
            this.handleNewProject(event);
        });

        EditSettingsItemEvent.on((event: EditSettingsItemEvent) => {
            this.handleItemEdit(event.getItems());
        });

        ProjectCreatedEvent.on((event: ProjectCreatedEvent) => {
            ProjectSelectionDialog.get().setUpdateOnOpen(true);
            this.deletedIds = this.deletedIds.filter((deletedId: string) => deletedId !== event.getProjectName());
        });

        ProjectDeletedEvent.on((event: ProjectDeletedEvent) => {
            if (!this.browsePanel) {
                return;
            }

            ProjectSelectionDialog.get().setUpdateOnOpen(true);
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

    private getWizardPanelForEdit(item: SettingsViewItem, tabId: AppBarTabId): SettingsDataItemWizardPanel<SettingsDataViewItem<any>> {
        if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem)) {
            const projectItem: ProjectViewItem = <ProjectViewItem>item;
            const wizard: ProjectWizardPanel = new ProjectWizardPanel({
                tabId,
                persistedItem: projectItem,
                type: projectItem.getType()
            });

            wizard.setHasChildrenLayers(this.browsePanel.hasChildren(projectItem.getId()));

            if (projectItem.getData() && projectItem.getData().getParent()) {
                const parentProject: Project =
                    (<ProjectViewItem>this.browsePanel.getItemById(projectItem.getData().getParent())).getData();
                wizard.setParentProject(parentProject);
            }

            return wizard;
        }

        return null;
    }

    private handleNewProject(event: NewProjectEvent) {
        const tabId: AppBarTabId = AppBarTabId.forNew(event.getProjectType().getName());
        const tabMenuItem: AppBarTabMenuItem = this.getAppBarTabMenu().getNavigationItemById(tabId);

        if (tabMenuItem != null) {
            this.selectPanel(tabMenuItem);
        } else {
            const parentProject: Project = event.getParentProject();
            const isLayer: boolean = event.getProjectType().equals(SettingsTypes.get().getLayer());
            const unnamedTabMenuText: string = NamePrettyfier.prettifyUnnamed(
                isLayer ? i18n('settings.items.type.layer') : i18n('settings.items.type.project')
            );
            const wizard: ProjectWizardPanel = new ProjectWizardPanel({
                tabId,
                type: event.getProjectType()
            });

            if (isLayer) {
                wizard.setParentProject(parentProject);
            }

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
        items.forEach((item: SettingsViewItem) => this.doHandleItemEdit(item));
    }

    private doHandleItemEdit(item: SettingsViewItem) {
        const tabId: AppBarTabId = AppBarTabId.forEdit(item.getId());
        const tabMenuItem: TabMenuItem = this.getAppBarTabMenu().getNavigationItemById(tabId);

        if (tabMenuItem != null) {
            this.selectPanel(tabMenuItem);
        } else {
            const unnamedTabMenuText: string = NamePrettyfier.prettifyUnnamed();
            const wizard: SettingsDataItemWizardPanel<SettingsDataViewItem<any>> = this.getWizardPanelForEdit(item, tabId);
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
    }

    private handleItemUpdated(projectName: string) {
        if (!this.browsePanel.hasItemsLoaded() || this.deletedIds.indexOf(projectName) > -1) {
            return;
        }

        new ProjectGetRequest(projectName).sendAndParse().then((updatedProject: Project) => {
            this.handleProjectUpdated(updatedProject);
        }).catch(DefaultErrorHandler.handle);
    }

    private handleProjectUpdated(project: Project) {
        if (!this.isItemPresentInBrowsePanel(project.getName())) {
            this.addNewProject(project);
        } else {
            this.updateExistingProject(project);
        }
    }

    private addNewProject(project: Project) {
        const item: ProjectViewItem = ProjectViewItem.create()
            .setData(project)
            .build();

        this.browsePanel.addSettingsItem(item);
        this.getProjectWizards().forEach((wizardPanel: ProjectWizardPanel) => {
            if (wizardPanel.isItemPersisted() && wizardPanel.getPersistedItem().getId() === project.getParent()) {
                wizardPanel.setHasChildrenLayers(true);
            }
        });
    }

    private updateExistingProject(project: Project) {
        const item: ProjectViewItem = ProjectViewItem.create()
            .setData(project)
            .build();
        this.browsePanel.updateSettingsItem(item);
        this.updateProjectWizards(item);
    }

    private updateProjectWizards(projectItem: ProjectViewItem) {
        this.getProjectWizards().forEach((projectWizardPanel: ProjectWizardPanel) => {
            this.updateProjectWizard(projectWizardPanel, projectItem);
        });
    }

    private updateProjectWizard(projectWizardPanel: ProjectWizardPanel, projectItem: ProjectViewItem) {
        if (projectWizardPanel.hasPersistedItemWithId(projectItem.getId())) {
            this.updateTabLabel(AppBarTabId.forEdit(projectItem.getName()), projectItem.getDisplayName());
            projectWizardPanel.updatePersistedSettingsDataItem(projectItem);
        }

        if (projectWizardPanel.getParentProject() === projectItem.getName()) {
            projectWizardPanel.setParentProject(projectItem.getData());
        }
    }

    private getProjectWizards(): ProjectWizardPanel[] {
        return <ProjectWizardPanel[]>this.getPanels().filter(this.isProjectWizardPanel);
    }

    private isSettingsItemWizardPanel(panel: Panel): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(panel, SettingsDataItemWizardPanel);
    }

    private isProjectWizardPanel(panel: Panel): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(panel, ProjectWizardPanel);
    }

    private updateTabLabel(tabId: AppBarTabId, label: string) {
        const tabMenuItem: TabMenuItem = this.getAppBarTabMenu().getNavigationItemById(tabId);
        if (!tabMenuItem) {
            return;
        }

        tabMenuItem.setLabel(label);
    }

    private handleItemDeleted(itemId: string) {
        this.deletedIds.push(itemId);
        this.browsePanel.deleteSettingsItem(itemId);

        this.getProjectWizards().filter((p: ProjectWizardPanel) => p.isItemPersisted()).forEach((panel: ProjectWizardPanel) => {
            if (panel.hasPersistedItemWithId(itemId)) {
                panel.close();
            } else if (!this.browsePanel.hasChildren(panel.getPersistedItem().getId())) {
                panel.setHasChildrenLayers(false);
            }
        });
    }

    private isItemPresentInBrowsePanel(id: string) {
        return this.browsePanel.hasItemWithId(id);
    }

}
