import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {type NamesView} from '@enonic/lib-admin-ui/app/NamesView';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';

export class ExtendedViewer<OBJECT> extends NamesAndIconViewer<OBJECT> {

    constructor(className?: string) {
        super('extended-viewer ' + (className ? className : ''));
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
        const displayName = this.resolveDisplayName(object) || this.normalizeDisplayName(this.resolveUnnamedDisplayName(object));
        const displayNameEl: Element = new SpanEl('display-name').setHtml(displayName);
        const nameEl: Element = new SpanEl('display-name-postfix').setHtml(this.resolveSecondaryName(object));

        namesView.setMainNameElements([displayNameEl, nameEl]);
    }

}
