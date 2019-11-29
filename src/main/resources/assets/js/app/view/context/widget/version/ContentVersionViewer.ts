import {ContentVersion} from '../../../../ContentVersion';
import DateHelper = api.util.DateHelper;

export class ContentVersionViewer
    extends api.ui.Viewer<ContentVersion> {

    private namesAndIconView: api.app.NamesAndIconView;

    constructor() {
        super();
        this.namesAndIconView = new api.app.NamesAndIconViewBuilder().setSize(api.app.NamesAndIconViewSize.small).build();
        this.appendChild(this.namesAndIconView);
    }
    getPreferredHeight(): number {
        return 50;
    }

    setObject(contentVersion: ContentVersion, isInMaster?: boolean) {

        this.namesAndIconView
            .setMainName(contentVersion.getModifierDisplayName())
            .setSubName(DateHelper.getModifiedString(contentVersion.getModified()))
            .setIconClass(contentVersion.getPublishInfo() && isInMaster
                          ? 'icon-version-published'
                          : contentVersion.isInReadyState()
                            ? 'icon-state-ready'
                            : 'icon-version-modified');

        return super.setObject(contentVersion);
    }
}
