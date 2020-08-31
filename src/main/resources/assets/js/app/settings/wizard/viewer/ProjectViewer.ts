import {Project} from '../../data/project/Project';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ProjectIconUrlResolver} from '../../../project/ProjectIconUrlResolver';
import {ExtendedViewer} from '../../../view/ExtendedViewer';
import {Flag} from 'lib-admin-ui/locale/Flag';

export class ProjectViewer extends ExtendedViewer<Project> {

    constructor(className?: string) {
        super('project-viewer ' + (!!className ? className : ''));
    }

    resolveDisplayName(project: Project): string {
        return project.getDisplayName();
    }

    resolveUnnamedDisplayName(project: Project): string {
        return '';
    }

    resolveSubName(project: Project): string {
        return project.getDescription() || `<${i18n('text.noDescription')}>`;
    }

    resolveIconClass(project: Project): string {
        return ProjectIconUrlResolver.getDefaultIcon(project);
    }

    resolveIconEl(project: Project): Flag {
        if (project.getIcon()) {
            return null;
        }

        const language: string = project.getLanguage();
        return !!language ? new Flag(language) : null;
    }

    resolveIconUrl(project: Project): string {
        return project.getIcon() ? new ProjectIconUrlResolver()
            .setProjectName(project.getName())
            .setTimestamp(new Date().getTime())
            .resolve() : null;
    }

    protected resolveSecondaryName(project: Project): string {
        return project.getLanguage() ? `(${project.getLanguage()})` : '';
    }
}
