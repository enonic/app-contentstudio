import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {NamesView} from 'lib-admin-ui/app/NamesView';
import {Element} from 'lib-admin-ui/dom/Element';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';

export class ExtendedViewer<OBJECT> extends NamesAndIconViewer<OBJECT> {

    constructor(className?: string) {
        super('extended-viewer ' + (!!className ? className : ''));
    }

    protected resolveSecondaryName(object: OBJECT): string {
        return '';
    }

    doLayout(object: OBJECT) {
        super.doLayout(object);

        if (!object) {
            return;
        }

        const namesView: NamesView = this.namesAndIconView.getNamesView();

        const displayNameEl: Element = new SpanEl('display-name').setHtml(this.resolveDisplayName(object));
        const nameEl: Element = new SpanEl('display-name-postfix').setHtml(this.resolveSecondaryName(object));

        namesView.setMainNameElements([displayNameEl, nameEl]);
    }

}
