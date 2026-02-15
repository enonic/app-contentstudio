import {AriaHasPopup, AriaRole, WCAG} from '@enonic/lib-admin-ui/ui/WCAG';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Flag} from '../../../locale/Flag';
import {ProjectIconUrlResolver} from '../../../project/ProjectIconUrlResolver';
import {ExtendedViewer} from '../../../view/ExtendedViewer';
import {type Project} from '../../data/project/Project';
import {ProjectHelper} from '../../data/project/ProjectHelper';

export class ProjectViewer
    extends ExtendedViewer<Project>
    implements WCAG {

    [WCAG]: boolean = true;
    ariaLabel: string = i18n('wcag.projectViewer.label');
    ariaHasPopup: AriaHasPopup = AriaHasPopup.DIALOG;
    role: AriaRole = AriaRole.BUTTON;
    tabbable: boolean = true;

    constructor(className?: string) {
        super(`project-viewer ${className ?? ''}`);
    }

    doLayout(object: Project) {
        super.doLayout(object);

        if (!object) {
            return;
        }

        this.toggleClass('not-available', !ProjectHelper.isAvailable(object));
    }

    resolveDisplayName(project: Project): string {
        return project.getDisplayName() || project.getName();
    }

    resolveUnnamedDisplayName(project: Project): string {
        return '';
    }

    resolveSubName(project: Project): string {
        return project.getDisplayName() ? project.getName() : `<${i18n('settings.project.notAvailable')}>`;
    }

    resolveIconClass(project: Project): string {
        return ProjectIconUrlResolver.getDefaultIcon(project);
    }

    resolveIconEl(project: Project): Flag {
        if (project.getIcon()) {
            return null;
        }

        const language: string = project.getLanguage();
        return language ? new Flag(language) : null;
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
