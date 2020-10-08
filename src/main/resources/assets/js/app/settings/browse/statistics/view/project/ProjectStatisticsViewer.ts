import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {ProjectViewItem} from '../../../../view/ProjectViewItem';
import {ProjectIconUrlResolver} from '../../../../../project/ProjectIconUrlResolver';
import {Flag} from 'lib-admin-ui/locale/Flag';

export class ProjectStatisticsViewer extends NamesAndIconViewer<ProjectViewItem> {

    constructor() {
        super('project-statistics-viewer');
    }

    resolveDisplayName(project: ProjectViewItem): string {
        return project.getDisplayName();
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
        return !!language ? new Flag(language) : null;
    }

    resolveIconUrl(project: ProjectViewItem): string {
        return project.getData().getIcon() ? new ProjectIconUrlResolver()
            .setProjectName(project.getName())
            .setTimestamp(new Date().getTime())
            .resolve() : null;
    }
}
