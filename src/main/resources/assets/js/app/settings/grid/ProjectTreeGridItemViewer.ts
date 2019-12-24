import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {NamesView} from 'lib-admin-ui/app/NamesView';
import {Element} from 'lib-admin-ui/dom/Element';
import {ProjectItem} from '../data/ProjectItem';
import {SettingsItemViewer} from '../data/viewer/SettingsItemViewer';

export class ProjectTreeGridItemViewer
    extends SettingsItemViewer {

    doLayout(item: ProjectItem) {
        super.doLayout(item);

        const namesView: NamesView = this.namesAndIconView.getNamesView();
        namesView.getFirstChild().setHtml('');
        const displayNameEl: Element = new SpanEl('display-name').setHtml(item.getDisplayName());
        const nameEl: Element = new SpanEl('name').setHtml(`(${item.getName()})`);
        namesView.getFirstChild().appendChildren(displayNameEl, nameEl);
    }
}

