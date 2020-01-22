import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {NamesView} from 'lib-admin-ui/app/NamesView';
import {Element} from 'lib-admin-ui/dom/Element';
import {SettingsItemViewer} from './SettingsItemViewer';
import {SettingsItem} from '../SettingsItem';

export class ProjectItemViewer
    extends SettingsItemViewer {

    constructor(className?: string) {
        super('project-viewer ' + (className || ''));
    }

    doLayout(item: SettingsItem) {
        super.doLayout(item);

        if (!item) {
            return;
        }

        const namesView: NamesView = this.namesAndIconView.getNamesView();
        namesView.getFirstChild().setHtml('');
        const displayNameEl: Element = new SpanEl('display-name').setHtml(item.getDisplayName());
        const nameEl: Element = new SpanEl('name').setHtml(`(${item.getId()})`);
        namesView.getFirstChild().appendChildren(displayNameEl, nameEl);
        namesView.toggleClass('no-description', !item.getDescription());
    }

}

