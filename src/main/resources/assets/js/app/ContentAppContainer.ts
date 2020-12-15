import {MainAppContainer} from './MainAppContainer';
import {ContentAppBar} from './bar/ContentAppBar';
import {Application} from 'lib-admin-ui/app/Application';
import {ContentAppPanel} from './ContentAppPanel';
import {ToggleSearchPanelWithDependenciesGlobalEvent} from './browse/ToggleSearchPanelWithDependenciesGlobalEvent';
import {ToggleSearchPanelWithDependenciesEvent} from './browse/ToggleSearchPanelWithDependenciesEvent';
import {ContentEventsListener} from './ContentEventsListener';
import {AppMode} from './AppMode';
import {ProjectContext} from './project/ProjectContext';
import {UrlAction} from './UrlAction';
import {ProjectDeletedEvent} from './settings/event/ProjectDeletedEvent';
import {Project} from './settings/data/project/Project';
import {ProjectListRequest} from './settings/resource/ProjectListRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {AppContext} from './AppContext';

export class ContentAppContainer
    extends MainAppContainer {

    protected appBar: ContentAppBar;

    constructor() {
        super();

        if (!ProjectContext.get().isInitialized()) {
            this.handleProjectNotSet();
        } else {
            new ContentEventsListener().start();
            this.initListeners();
        }
    }

    private handleProjectNotSet() {
        this.appBar.disable();

        const projectSetHandler = () => {
            this.appBar.enable();
            new ContentEventsListener().start();
            this.initListeners();
            ProjectContext.get().unProjectChanged(projectSetHandler);
        };

        ProjectContext.get().onProjectChanged(projectSetHandler);
    }

    protected createAppBar(application: Application): ContentAppBar {
        return new ContentAppBar(application);
    }

    protected createAppPanel(): ContentAppPanel {
        return new ContentAppPanel(AppContext.get().getApplication().getPath());
    }

    private initListeners() {
        this.initSearchPanelListener(<ContentAppPanel>this.appPanel);

        ProjectDeletedEvent.on((event: ProjectDeletedEvent) => {
            this.handleProjectDeletedEvent(event.getProjectName());
        });
    }

    private handleProjectDeletedEvent(projectName: string) {
        const currentProject: Project = ProjectContext.get().getProject();
        const isCurrentProjectDeleted: boolean = projectName === currentProject.getName();

        if (isCurrentProjectDeleted) {
            this.handleCurrentProjectDeleted();
        }
    }

    private handleCurrentProjectDeleted() {
        const currentProject: Project = ProjectContext.get().getProject();

        new ProjectListRequest().sendAndParse().then((projects: Project[]) => {
            if (projects.length > 0) {
                const parentProject: Project = projects.find((project: Project) => project.getName() === currentProject.getParent());
                if (parentProject) {
                    ProjectContext.get().setProject(parentProject);
                } else {
                    const defaultProject: Project = projects.find((project: Project) => project.getName() === Project.DEFAULT_PROJECT_NAME);
                    const projectToSet: Project = !!defaultProject ? defaultProject : projects[0];
                    ProjectContext.get().setProject(projectToSet);
                }
            } else {
                this.handleNoProjectsAvailable();
            }
        }).catch(DefaultErrorHandler.handle);
    }

    private handleNoProjectsAvailable() {
    //
    }

    private initSearchPanelListener(panel: ContentAppPanel) {
        ToggleSearchPanelWithDependenciesGlobalEvent.on((event) => {
            if (!panel.getBrowsePanel().getTreeGrid().isEmpty()) {
                new ToggleSearchPanelWithDependenciesEvent(event.getContent(), event.isInbound()).fire();
            } else {
                const handler = () => {
                    new ToggleSearchPanelWithDependenciesEvent(event.getContent(), event.isInbound()).fire();
                    panel.getBrowsePanel().getTreeGrid().unLoaded(handler);
                };

                panel.getBrowsePanel().getTreeGrid().onLoaded(handler);
            }
        });
    }

    generateAppUrl(): string {
        return `${AppMode.MAIN}#/${ProjectContext.get().getProject().getName()}/${UrlAction.BROWSE}`;
    }

}
