import {NavigatedAppPanel} from 'lib-admin-ui/app/NavigatedAppPanel';
import {SettingsBrowsePanel} from './browse/SettingsBrowsePanel';
import {SettingsAppBar} from './SettingsAppBar';
import {NewProjectEvent} from './event/NewProjectEvent';
import {AppBarTabId} from 'lib-admin-ui/app/bar/AppBarTabId';
import {AppBarTabMenuItem, AppBarTabMenuItemBuilder} from 'lib-admin-ui/app/bar/AppBarTabMenuItem';
import {ProjectWizardPanel} from './wizard/panel/ProjectWizardPanel';
import {ContentUnnamed} from 'lib-admin-ui//content/ContentUnnamed';
import {i18n} from 'lib-admin-ui/util/Messages';
import {TabMenuItem} from 'lib-admin-ui/ui/tab/TabMenuItem';
import {EditSettingsItemEvent} from './event/EditSettingsItemEvent';
import {SettingsDataItemWizardPanel} from './wizard/panel/SettingsDataItemWizardPanel';
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
import {ProjectHelper} from './data/project/ProjectHelper';
import {ProjectSelectionDialog} from './dialog/ProjectSelectionDialog';
import {ProjectCreatedEvent} from './event/ProjectCreatedEvent';
import {SettingsTypes} from './dialog/SettingsTypes';

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

        NewProjectEvent.on((event: NewProjectEvent) => {
            this.handleNewProject(event);
        });

        EditSettingsItemEvent.on((event: EditSettingsItemEvent) => {
            this.handleItemEdit(event.getItems());
        });

        ProjectCreatedEvent.on(() => {
            ProjectSelectionDialog.get().setUpdateOnOpen(true);
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

    private getWizardPanelFor(item: SettingsViewItem, tabId: AppBarTabId): SettingsDataItemWizardPanel<SettingsDataViewItem<any>> {
        if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem)) {
            const projectItem: ProjectViewItem = <ProjectViewItem>item;
            const wizard: ProjectWizardPanel = new ProjectWizardPanel({
                tabId,
                persistedItem: projectItem,
                type: projectItem.getType()
            });

            if (projectItem.getData() && projectItem.getData().getParent()) {
                ProjectHelper.fetchProject(projectItem.getData().getParent())
                    .then((project: Project) => wizard.setParentProject(project))
                    .catch(DefaultErrorHandler.handle);
            }

            return wizard;
        }

        return null;
    }

    private handleNewProject(event: NewProjectEvent) {
        const parentProject = event.getParentProject();
        const tabId: AppBarTabId = AppBarTabId.forNew('project');
        const tabMenuItem: AppBarTabMenuItem = this.getAppBarTabMenu().getNavigationItemById(tabId);

        if (tabMenuItem != null) {
            this.selectPanel(tabMenuItem);
        } else {
            const isLayer = event.getProjectType().equals(SettingsTypes.LAYER);
            const unnamedTabMenuText: string = ContentUnnamed.prettifyUnnamed(
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
    }

    private handleItemUpdated(projectName: string) {
        if (!this.browsePanel.hasItemsLoaded()) {
            return;
        }

        new ProjectListRequest().sendAndParse().then((projects: Project[]) => {
            ProjectSelectionDialog.get().setProjects(projects);
            this.doHandleItemUpdated(projectName, projects);
        }).catch(DefaultErrorHandler.handle);
    }

    private doHandleItemUpdated(updatedProjectName: string, allProjects: Project[]) {
        const updatedProject: Project = allProjects.find((project: Project) => project.getName() === updatedProjectName);

        if (updatedProject) {
            this.handleProjectUpdated(updatedProject);
        } else {
            if (this.isItemPresentInBrowsePanel(updatedProjectName)) {
                this.browsePanel.deleteSettingsItem(updatedProjectName);
            }
        }
    }

    private handleProjectUpdated(project: Project) {
        const item: ProjectViewItem = ProjectViewItem.create()
            .setData(project)
            .build();

        if (!this.isItemPresentInBrowsePanel(project.getName())) {
            this.browsePanel.addSettingsItem(item);
        } else {
            this.browsePanel.updateSettingsItem(item);
            this.updateProjectWizards(item);
        }
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

    private isItemPresentInBrowsePanel(id: string) {
        return this.browsePanel.hasItemWithId(id);
    }

}
