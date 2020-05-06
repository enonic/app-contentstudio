import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {WidgetItemView} from '../../WidgetItemView';
import {GetContentAttachmentsRequest} from '../../../../resource/GetContentAttachmentsRequest';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {Attachments} from '../../../../attachment/Attachments';
import {Attachment} from '../../../../attachment/Attachment';
import {AttachmentName} from '../../../../attachment/AttachmentName';
import {UlEl} from 'lib-admin-ui/dom/UlEl';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {LiEl} from 'lib-admin-ui/dom/LiEl';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {UrlHelper} from '../../../../util/UrlHelper';

export class AttachmentsWidgetItemView extends WidgetItemView {

    private content: ContentSummary;

    private list: UlEl;

    private placeholder: SpanEl;

    public static debug: boolean = false;

    constructor() {
        super('attachments-widget-item-view');
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<any> {
        let content = item.getContentSummary();
        if (AttachmentsWidgetItemView.debug) {
            console.debug('AttachmentsWidgetItemView.setContent: ', content);
        }
        if (!ObjectHelper.equals(content, this.content)) {
            this.content = content;
            return this.layout();
        }
        return Q<any>(null);
    }

    public layout(): Q.Promise<any> {
        if (AttachmentsWidgetItemView.debug) {
            console.debug('AttachmentsWidgetItemView.layout');
        }

        return super.layout().then(() => {
            if (this.content != null) {
                return this.layoutAttachments();
            } else {
                this.removeChildren();
            }
        });
    }

    private layoutAttachments(): Q.Promise<Attachments> {
        return new GetContentAttachmentsRequest(this.content.getContentId()).sendAndParse().then(
            (attachments: Attachments) => {

                if (this.hasChild(this.list)) {
                    this.removeChild(this.list);
                }

                if (this.hasChild(this.placeholder)) {
                    this.removeChild(this.placeholder);
                }

                if (attachments) {
                    this.list = new UlEl('attachment-list');

                    let contentId = this.content.getContentId();
                    attachments.forEach((attachment: Attachment) => {
                        let attachmentContainer = new LiEl('attachment-container');
                        let link = this.createLinkEl(contentId, attachment.getName());
                        attachmentContainer.appendChild(link);
                        this.list.appendChild(attachmentContainer);

                    });

                    this.appendChild(this.list);

                } else {
                    this.placeholder = new SpanEl('att-placeholder').setHtml(i18n('field.widget.noAttachments'));
                    this.appendChild(this.placeholder);
                }

                return attachments;
            });
    }

    private createLinkEl(contentId: ContentId, attachmentName: AttachmentName): AEl {
        const name: string = encodeURIComponent(attachmentName.toString());
        const url: string = `${UrlHelper.getCMSPath()}/content/media/${contentId.toString()}/${name}`;
        const link: AEl = new AEl().setUrl(UriHelper.getRestUri(url), '_blank');
        link.setHtml(attachmentName.toString());
        return link;
    }

}
