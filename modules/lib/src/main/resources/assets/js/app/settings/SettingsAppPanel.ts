import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';
import {NavigatedAppPanel} from '@enonic/lib-admin-ui/app/NavigatedAppPanel';
import {SettingsBrowsePanel} from './browse/SettingsBrowsePanel';
import {AppBarTabId} from '@enonic/lib-admin-ui/app/bar/AppBarTabId';
import {AppBarTabMenuItem, AppBarTabMenuItemBuilder} from '@enonic/lib-admin-ui/app/bar/AppBarTabMenuItem';
import {ProjectWizardPanel} from './wizard/panel/ProjectWizardPanel';
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
import {ProjectSelectionDialog} from '../dialog/ProjectSelectionDialog';
import {ProjectCreatedEvent} from './event/ProjectCreatedEvent';
import {ProjectGetRequest} from './resource/ProjectGetRequest';
import {ContentAppBar} from '../bar/ContentAppBar';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ProjectsUtil} from './resource/ProjectsUtil';
import {Projects} from './resource/Projects';

export class SettingsAppPanel
    extends NavigatedAppPanel {

    declare protected browsePanel: SettingsBrowsePanel;

    private deletedIds: string[] = [];

    constructor() {
        // TODO: Enonic UI Hack
        // When possible, remove ContentAppBar dependency or migrate to AppBarElement
        super(ContentAppBar.getInstance());
    }

    protected createBrowsePanel(): SettingsBrowsePanel {
        return new SettingsBrowsePanel();
    }

    protected handleGlobalEvents() {
        super.handleGlobalEvents();

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

    private getWizardPanelForEdit(item: SettingsViewItem, tabId: AppBarTabId): SettingsDataItemWizardPanel<SettingsDataViewItem<Equitable>> {
        if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem)) {
            const projectItem: ProjectViewItem = item as ProjectViewItem;
            const wizard: ProjectWizardPanel = new ProjectWizardPanel({
                tabId,
                persistedItem: projectItem,
                type: projectItem.getType()
            });

            wizard.setHasChildrenLayers(ProjectsUtil.hasChildren(projectItem.getId()));

            if (projectItem.getData()?.hasParents()) {
                const parentProjects = projectItem.getData().getParents().map(id => {
                    return (this.browsePanel.getItemById(id) as ProjectViewItem)?.getData();
                }).filter(pp => !!pp);
                wizard.updateParentProjects(parentProjects);
            }

            return wizard;
        }

        return null;
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
            const wizard: SettingsDataItemWizardPanel<SettingsDataViewItem<Equitable>> = this.getWizardPanelForEdit(item, tabId);
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
        if (!this.browsePanel.isRendered() || this.deletedIds.indexOf(projectName) > -1) {
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
        Projects.get().setProjects([...Projects.get().getProjects().filter(p => p.getName() !== project.getName()), project]);

        const item: ProjectViewItem = ProjectViewItem.create()
            .setData(project)
            .build();

        this.browsePanel.addSettingsItem(item);
        this.getProjectWizards().forEach((wizardPanel: ProjectWizardPanel) => {
            if (wizardPanel.isItemPersisted() && project.hasParentByName(wizardPanel.getPersistedItem().getId())) {
                wizardPanel.setHasChildrenLayers(true);
            }
        });
    }

    private updateExistingProject(project: Project) {
        Projects.get().setProjects([...Projects.get().getProjects().filter(p => p.getName() !== project.getName()), project]);

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

        const parentIndex = (projectWizardPanel.getParentProjectsNames() || []).indexOf(projectItem.getName());
        const isParent = parentIndex >= 0;
        if (isParent) {
            const projects = [...projectWizardPanel.getParentProjects()];
            projects[parentIndex] = projectItem.getData();
            projectWizardPanel.updateParentProjects(projects);
        }
    }

    private getProjectWizards(): ProjectWizardPanel[] {
        return this.getPanels().filter(this.isProjectWizardPanel) as ProjectWizardPanel[];
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

    private handleItemDeleted(itemId: string): void {
        Projects.get().setProjects(Projects.get().getProjects().filter((project: Project) => project.getName() !== itemId));
        this.deletedIds.push(itemId);
        this.browsePanel.deleteSettingsItem(itemId);

        this.getProjectWizards().filter((p: ProjectWizardPanel) => p.isItemPersisted()).forEach((panel: ProjectWizardPanel) => {
            if (panel.hasPersistedItemWithId(itemId)) {
                panel.close();
            } else if (!ProjectsUtil.hasChildren(panel.getPersistedItem().getId())) {
                panel.setHasChildrenLayers(false);
            }
        });
    }

    private isItemPresentInBrowsePanel(id: string) {
        return this.browsePanel.hasItemWithId(id);
    }

}
