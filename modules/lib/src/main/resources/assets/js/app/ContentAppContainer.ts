import {AppContainer} from './AppContainer';
import {ContentAppBar} from './bar/ContentAppBar';
import {Application} from 'lib-admin-ui/app/Application';
import {ContentAppPanel} from './ContentAppPanel';
import {ToggleSearchPanelWithDependenciesGlobalEvent} from './browse/ToggleSearchPanelWithDependenciesGlobalEvent';
import {ToggleSearchPanelWithDependenciesEvent} from './browse/ToggleSearchPanelWithDependenciesEvent';
import {ContentEventsListener} from './ContentEventsListener';
import {ProjectContext} from './project/ProjectContext';
import {UrlAction} from './UrlAction';
import {ProjectDeletedEvent} from './settings/event/ProjectDeletedEvent';
import {Project} from './settings/data/project/Project';
import {ProjectListRequest} from './settings/resource/ProjectListRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {AppContext} from './AppContext';
import {ContentSummaryAndCompareStatusFetcher} from './resource/ContentSummaryAndCompareStatusFetcher';
import {ContentId} from './content/ContentId';
import {ContentSummaryAndCompareStatus} from './content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from './event/EditContentEvent';
import {GetIssueRequest} from './issue/resource/GetIssueRequest';
import {Issue} from './issue/Issue';
import {IssueDialogsManager} from './issue/IssueDialogsManager';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentTreeGridLoadedEvent} from './browse/ContentTreeGridLoadedEvent';
import {ResolveDependenciesRequest} from './resource/ResolveDependenciesRequest';
import {ResolveDependenciesResult} from './resource/ResolveDependenciesResult';
import {ResolveDependencyResult} from './resource/ResolveDependencyResult';
import {Router} from './Router';
import {showFeedback} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';

export class ContentAppContainer
    extends AppContainer {

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
        return new ContentAppPanel();
    }

    private initListeners() {
        this.initSearchPanelListener(<ContentAppPanel>this.appPanel);

        ProjectDeletedEvent.on((event: ProjectDeletedEvent) => {
            this.handleProjectDeletedEvent(event.getProjectName());
        });

        this.onShown(() => {
            this.route(AppContext.get().getApplication().getPath());
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
        this.appBar.disable();

        ProjectContext.get().setNotAvailable();
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

    private route(path?: Path) {
        const action = path ? path.getElement(1) : null;
        const actionAsTabMode: UrlAction = !!action ? UrlAction[action.toUpperCase()] : null;
        const id = path ? path.getElement(2) : null;
        const type = path ? path.getElement(3) : null;

        switch (actionAsTabMode) {
        case UrlAction.LOCALIZE:
        case UrlAction.EDIT:
            if (id) {
                ContentSummaryAndCompareStatusFetcher.fetch(new ContentId(id)).done(
                    (content: ContentSummaryAndCompareStatus) => {
                        new EditContentEvent([content]).fire();
                    });
            }
            break;
        case UrlAction.ISSUE:
            if (id) {
                new GetIssueRequest(id).sendAndParse().then(
                    (issue: Issue) => {
                        IssueDialogsManager.get().openDetailsDialogWithListDialog(issue);
                    });
            }
            break;
        case UrlAction.INBOUND:
            this.handleDependencies(id, true, type);
            break;
        case UrlAction.OUTBOUND:
            this.handleDependencies(id, false, type);
            break;
        }
    }

    private handleDependencies(id: string, inbound: boolean, type?: string) {
        const treeGridLoadedListener = () => {
            this.doHandleDependencies(id, inbound, type);

            ContentTreeGridLoadedEvent.un(treeGridLoadedListener);
        };

        ContentTreeGridLoadedEvent.on(treeGridLoadedListener);
    }

    private doHandleDependencies(id: string, inbound: boolean, type?: string) {
        const contentId: ContentId = new ContentId(id);

        new ResolveDependenciesRequest([contentId]).sendAndParse().then((result: ResolveDependenciesResult) => {
            const dependencyEntry: ResolveDependencyResult = result.getDependencies()[0];

            const hasDependencies: boolean = inbound
                                             ? dependencyEntry.getDependency().inbound.length > 0
                                             : dependencyEntry.getDependency().outbound.length > 0;

            if (hasDependencies) {
                this.toggleSearchPanelWithDependencies(id, inbound, type);
            } else {
                showFeedback(i18n('notify.dependencies.absent', id));
            }
        }).catch(reason => DefaultErrorHandler.handle(reason));
    }

    private toggleSearchPanelWithDependencies(id: string, inbound: boolean, type?: string) {
        ContentSummaryAndCompareStatusFetcher.fetch(new ContentId(id)).done(
            (content: ContentSummaryAndCompareStatus) => {
                new ToggleSearchPanelWithDependenciesEvent(content.getContentSummary(), inbound, type).fire();

                const mode: string = inbound ? UrlAction.INBOUND : UrlAction.OUTBOUND;
                const hash: string = !!type ? `${mode}/${id}/${type}` : `${mode}/${id}`;

                Router.get().setHash(hash);
            });
    }

}
