import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {NamesView} from 'lib-admin-ui/app/NamesView';
import {Element} from 'lib-admin-ui/dom/Element';
import {SettingsItemViewer} from './SettingsItemViewer';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {ProjectIconUrlResolver} from '../../../project/ProjectIconUrlResolver';

export class ProjectItemViewer
    extends SettingsItemViewer {

    constructor(className?: string) {
        super('project-item-viewer ' + (className || ''));
    }

    doLayout(item: ProjectViewItem) {
        super.doLayout(item);

        if (!item) {
            return;
        }

        const namesView: NamesView = this.namesAndIconView.getNamesView();

        const displayNameEl: Element = new SpanEl('display-name').setHtml(item.getDisplayName());
        const nameEl: Element = new SpanEl('name').setHtml(item.getLanguage() ? `(${item.getLanguage()})` : '');

        namesView.setMainNameElements([displayNameEl, nameEl]);
    }

    resolveIconUrl(item: ProjectViewItem): string {
        return item.getData().getIcon() ? new ProjectIconUrlResolver()
            .setProjectName(item.getName())
            .setTimestamp(new Date().getTime())
            .resolve() : null;
    }
}

