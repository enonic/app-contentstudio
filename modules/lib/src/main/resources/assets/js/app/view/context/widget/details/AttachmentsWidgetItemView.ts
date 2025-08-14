import Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {WidgetItemView} from '../../WidgetItemView';
import {GetContentAttachmentsRequest} from '../../../../resource/GetContentAttachmentsRequest';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {Attachments} from '../../../../attachment/Attachments';
import {Attachment} from '../../../../attachment/Attachment';
import {AttachmentName} from '../../../../attachment/AttachmentName';
import {UlEl} from '@enonic/lib-admin-ui/dom/UlEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {LiEl} from '@enonic/lib-admin-ui/dom/LiEl';
import {ContentSummary} from '../../../../content/ContentSummary';
import {ContentId} from '../../../../content/ContentId';
import {ContentPath} from '../../../../content/ContentPath';

export class AttachmentsWidgetItemView extends WidgetItemView {

    private content: ContentSummary;

    private list: UlEl;

    private placeholder: SpanEl;

    private contentRootPath: string;

    public static debug: boolean = false;

    constructor() {
        super('attachments-widget-item-view');

        this.contentRootPath = ContentPath.CONTENT_ROOT;
    }

    setContentRootPath(value: string): AttachmentsWidgetItemView {
        this.contentRootPath = value;
        return this;
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<void> {
        let content = item.getContentSummary();
        if (AttachmentsWidgetItemView.debug) {
            console.debug('AttachmentsWidgetItemView.setContent: ', content);
        }
        if (!ObjectHelper.equals(content, this.content)) {
            this.content = content;
            return this.layout();
        }
        return Q();
    }

    public layout(): Q.Promise<void> {
        if (AttachmentsWidgetItemView.debug) {
            console.debug('AttachmentsWidgetItemView.layout');
        }

        this.showLoadMask();

        return super.layout().then(() => {
            if (this.content != null) {
                return this.layoutAttachments();
            } else {
                this.removeChildren();
            }
        }).finally(() => {
            this.hideLoadMask();
        });
    }

    private layoutAttachments(): Q.Promise<void> {
        return new GetContentAttachmentsRequest(this.content.getContentId()).setContentRootPath(this.contentRootPath).sendAndParse().then(
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
                        let attachmentContainer = new LiEl('attachment-container icon-attachment');
                        let link = AttachmentsWidgetItemView.createLinkEl(contentId, attachment.getName(), this.contentRootPath);
                        attachmentContainer.appendChild(link);
                        this.list.appendChild(attachmentContainer);

                    });

                    this.appendChild(this.list);

                } else {
                    this.placeholder = new SpanEl('att-placeholder').setHtml(i18n('field.widget.noAttachments'));
                    this.appendChild(this.placeholder);
                }
            });
    }

    private static createLinkEl(contentId: ContentId, attachmentName: AttachmentName, contentRootPath: string): AEl {
        const url: string = Attachment.getUrl(contentId.toString(), attachmentName.toString(), contentRootPath);
        const link: AEl = new AEl().setUrl(url, '_blank');
        link.setHtml(attachmentName.toString());
        return link;
    }

}
