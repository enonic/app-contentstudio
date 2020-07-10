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
import {ProjectChangedEvent} from './project/ProjectChangedEvent';
import {ProjectUpdatedEvent} from './settings/event/ProjectUpdatedEvent';
import {ProjectDeletedEvent} from './settings/event/ProjectDeletedEvent';
import {Project} from './settings/data/project/Project';

export class ContentAppContainer
    extends MainAppContainer {

    protected appBar: ContentAppBar;

    constructor(application: Application) {
        super(application, AppMode.MAIN);

        if (!ProjectContext.get().isInitialized()) {
            this.handleProjectNotSet();
        } else {
            new ContentEventsListener().start();
            this.appBar.updateSelectedProjectValue();
            this.initListeners();
        }
    }

    private handleProjectNotSet() {
        this.appBar.disable();

        const projectSetHandler = () => {
            this.appBar.enable();
            this.appBar.updateSelectedProjectValue();
            new ContentEventsListener().start();
            this.initListeners();
            ProjectChangedEvent.un(projectSetHandler);
        };

        ProjectChangedEvent.on(projectSetHandler);
    }

    protected createAppBar(application: Application): ContentAppBar {
        return new ContentAppBar(application);
    }

    protected createAppPanel(): ContentAppPanel {
        return new ContentAppPanel(this.application.getPath());
    }

    private initListeners() {
        this.initSearchPanelListener(<ContentAppPanel>this.appPanel);

        ProjectDeletedEvent.on((event: ProjectDeletedEvent) => {
            this.handleProjectDeletedEvent(event.getProjectName());
        });

        ProjectUpdatedEvent.on(() => {
            this.handleProjectUpdatedEvent();
        });
    }

    private handleProjectUpdatedEvent() {
        (<ContentAppBar>this.appBar).updateSelectedProjectValue();
    }

    private handleProjectDeletedEvent(projectName: string) {
        const currentProject: Project = ProjectContext.get().getProject();
        const isCurrentProjectDeleted: boolean = projectName === currentProject.getName();

        if (isCurrentProjectDeleted) {
            ProjectContext.get().resetToDefaultProject();
        }
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
        return `${AppMode.MAIN}#/${ProjectContext.get().getProject()}/${UrlAction.BROWSE}`;
    }

}
