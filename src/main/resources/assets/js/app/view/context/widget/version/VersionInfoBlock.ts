import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentVersion} from '../../../../ContentVersion';
import {PEl} from 'lib-admin-ui/dom/PEl';
import {NamesAndIconView, NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';

export class VersionInfoBlock
    extends DivEl {

    private contentVersion: ContentVersion;

    private messageBlock: DivEl;
    private publisherBlock: NamesAndIconView;

    constructor(contentVersion: ContentVersion) {
        super('version-info hidden');

        this.contentVersion = contentVersion;
        this.initElements();
    }

    private initElements() {
        if (!this.contentVersion.hasPublishInfo()) {
            return;
        }

        if (this.contentVersion.getPublishInfo().getMessage()) {
            this.messageBlock = new DivEl('version-info-message');
        }

        this.publisherBlock = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build();
        this.publisherBlock
            .setMainName(this.contentVersion.getPublishInfo().getPublisherDisplayName())
            .setSubName(DateHelper.getModifiedString(this.contentVersion.getPublishInfo().getTimestamp()))
            .setIconClass(this.contentVersion.isInReadyState() ? 'icon-state-ready' : 'icon-state-in-progress');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            if (this.messageBlock) {
                this.messageBlock.appendChild(new PEl('message').setHtml(this.contentVersion.getPublishInfo().getMessage()));
                this.insertChild(this.messageBlock, 0);
            }

            if (this.publisherBlock) {
                this.insertChild(this.publisherBlock, this.messageBlock ? 1 : 0);
            }

            return rendered;
        });
    }
}
