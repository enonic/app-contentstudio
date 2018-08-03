import '../../../../../api.ts';
import {ContentVersion} from '../../../../ContentVersion';

export class ContentVersionViewer
    extends api.ui.Viewer<ContentVersion> {

    private namesAndIconView: api.app.NamesAndIconView;

    constructor() {
        super();
        this.namesAndIconView = new api.app.NamesAndIconViewBuilder().setSize(api.app.NamesAndIconViewSize.small).build();
        this.appendChild(this.namesAndIconView);
    }

    private getModifierSpan(contentVersion: ContentVersion): api.dom.SpanEl {
        let span = new api.dom.SpanEl('version-modifier');

        span.setHtml(api.util.DateHelper.getModifiedString(contentVersion.modified));

        return span;
    }

    private getSubNameElements(contentVersion: ContentVersion): api.dom.Element[] {
        return [this.getModifierSpan(contentVersion)];
    }

    setObject(contentVersion: ContentVersion, row?: number) {

        //TODO: use content version image and number instead of row
        this.namesAndIconView
            .setMainName(contentVersion.modifierDisplayName)
            .setSubNameElements(this.getSubNameElements(contentVersion))
            .setIconClass('icon-user');

        return super.setObject(contentVersion);
    }
}
