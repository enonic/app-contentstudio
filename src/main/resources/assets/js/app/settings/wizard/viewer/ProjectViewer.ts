import {Project} from '../../data/project/Project';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ProjectIconUrlResolver} from '../../../project/ProjectIconUrlResolver';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {NamesView} from 'lib-admin-ui/app/NamesView';
import {Element} from 'lib-admin-ui/dom/Element';

export class ProjectViewer extends NamesAndIconViewer<Project> {

    constructor() {
        super('project-viewer');
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
        return ProjectIconUrlResolver.DEFAULT_ICON_CLASS;
    }

    resolveIconUrl(project: Project): string {
        return project.getIcon() ? new ProjectIconUrlResolver()
            .setProjectName(project.getName())
            .setTimestamp(new Date().getTime())
            .resolve() : null;
    }

    doLayout(project: Project) {
        super.doLayout(project);

        if (!project) {
            return;
        }

        const namesView: NamesView = this.namesAndIconView.getNamesView();

        const displayNameEl: Element = new SpanEl('display-name').setHtml(project.getDisplayName());
        const nameEl: Element = new SpanEl('name').setHtml(`(${project.getName()})`);

        namesView.setMainNameElements([displayNameEl, nameEl]);
    }
}
