import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import * as Q from 'q';
import {Flag} from '../../../../../locale/Flag';
import {ProjectIconUrlResolver} from '../../../../../project/ProjectIconUrlResolver';
import {Project} from '../../../../data/project/Project';
import {ProjectHelper} from '../../../../data/project/ProjectHelper';
import {ProjectCreatedEvent} from '../../../../event/ProjectCreatedEvent';
import {ProjectDeletedEvent} from '../../../../event/ProjectDeletedEvent';
import {ProjectUpdatedEvent} from '../../../../event/ProjectUpdatedEvent';
import {ProjectListRequest} from '../../../../resource/ProjectListRequest';
import {ProjectViewItem} from '../../../../view/ProjectViewItem';
import {ProjectsChainBlock} from '../../../../wizard/panel/form/element/ProjectsChainBlock';

export class ProjectStatisticsViewer
    extends NamesAndIconViewer<ProjectViewItem> {

    private readonly projectsChainBlock: ProjectsChainBlock;

    private allProjects: Project[];

    private projectsUpdateRequired: boolean = false;

    constructor() {
        super('project-statistics-viewer');

        this.projectsChainBlock = new ProjectsChainBlock();
        this.initListeners();
    }

    private initListeners() {
        const updateHandler = () => {
            this.projectsUpdateRequired = true;
        };

        ProjectCreatedEvent.on(updateHandler);
        ProjectUpdatedEvent.on(updateHandler);
        ProjectDeletedEvent.on(updateHandler);
    }

    resolveDisplayName(project: ProjectViewItem): string {
        return ProjectHelper.isAvailable(project.getData()) ? project.getDisplayName() : project.getId();
    }

    resolveUnnamedDisplayName(project: ProjectViewItem): string {
        return '';
    }

    resolveSubName(project: ProjectViewItem): string {
        return project.getId();
    }

    resolveIconClass(project: ProjectViewItem): string {
        return ProjectIconUrlResolver.getDefaultIcon(project.getData());
    }

    resolveIconEl(project: ProjectViewItem): Flag {
        if (project.getData().getIcon()) {
            return null;
        }

        const language: string = project.getLanguage();
        return language ? new Flag(language) : null;
    }

    resolveIconUrl(project: ProjectViewItem): string {
        return project.getData().getIcon() ? new ProjectIconUrlResolver()
            .setProjectName(project.getName())
            .setTimestamp(new Date().getTime())
            .resolve() : null;
    }

    doLayout(object: ProjectViewItem): void {
        super.doLayout(object);

        this.loadAllProjects().then(() => {
            this.updateProjectsChain(object.getData());
        }).catch(DefaultErrorHandler.handle);
    }

    private updateProjectsChain(project: Project) {
        this.getNamesAndIconView().setSubNameElements([this.projectsChainBlock]);
        this.projectsChainBlock.setProjectsChain(ProjectsChainBlock.buildProjectsChain(project.getName(), this.allProjects));
    }

    private loadAllProjects(): Q.Promise<void> {
        if (this.allProjects && !this.projectsUpdateRequired) {
            return Q();
        }

        return new ProjectListRequest(true).sendAndParse().then((projects: Project[]) => {
            this.allProjects = projects;
            this.projectsUpdateRequired = false;
        });
    }
}
