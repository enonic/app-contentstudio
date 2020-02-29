import {ContentVersion} from '../../../../ContentVersion';
import {Viewer} from 'lib-admin-ui/ui/Viewer';
import {NamesAndIconView, NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';

export class ContentVersionViewer
    extends Viewer<ContentVersion> {

    private namesAndIconView: NamesAndIconView;

    constructor() {
        super();
        this.namesAndIconView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build();
        this.appendChild(this.namesAndIconView);
    }
    getPreferredHeight(): number {
        return 50;
    }

    setObject(contentVersion: ContentVersion) {

        this.namesAndIconView
            .setMainName(contentVersion.getModifierDisplayName())
            .setSubName(DateHelper.getModifiedString(contentVersion.getModified()))
            .setIconClass(contentVersion.getPublishInfo() && contentVersion.isInMaster()
                          ? 'icon-version-published'
                          : contentVersion.isInReadyState()
                            ? 'icon-state-ready'
                            : 'icon-version-modified');

        return super.setObject(contentVersion);
    }
}
