import {SettingsItemViewer} from './SettingsItemViewer';
import {type ProjectViewItem} from '../../view/ProjectViewItem';
import {ProjectHelper} from '../../data/project/ProjectHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectIconUrlResolver} from '../../../project/ProjectIconUrlResolver';
import {Flag} from '../../../locale/Flag';
import {type NamesView} from '@enonic/lib-admin-ui/app/NamesView';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';

export class ProjectItemViewer
    extends SettingsItemViewer {

    constructor(className?: string) {
        super(`project-item-viewer ${className ?? ''}`);
    }

    doLayout(object: ProjectViewItem) {
        super.doLayout(object);

        if (!object) {
            return;
        }

        const localeEl: Element = new SpanEl('display-name-postfix').setHtml(this.resolveSecondaryName(object));
        const namesView: NamesView = this.namesAndIconView.getNamesView();
        namesView.getFirstChild().appendChild(localeEl);

        this.toggleClass('not-available', !ProjectHelper.isAvailable(object.data));
    }


    resolveDisplayName(project: ProjectViewItem): string {
        return project.getDisplayName() || project.getName();
    }

    resolveUnnamedDisplayName(project: ProjectViewItem): string {
        return '';
    }

    resolveSubName(project: ProjectViewItem): string {
        return project.getDisplayName() ? project.getName() : `<${i18n('settings.project.notAvailable')}>`;
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

    protected resolveSecondaryName(project: ProjectViewItem): string {
        return project.getLanguage() ? `(${project.getLanguage()})` : '';
    }
}
