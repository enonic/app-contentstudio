import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {FileUploaderEl} from './FileUploaderEl';
import {AttachmentItem} from './AttachmentItem';
import {Attachment, AttachmentBuilder} from '../../../attachment/Attachment';
import {AttachmentJson} from '../../../attachment/AttachmentJson';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';

export class AttachmentUploaderEl
    extends FileUploaderEl<Attachment> {

    private attachmentItems: AttachmentItem[];

    private removeCallback: (value: string) => void;
    private addCallback: (value: string) => void;

    constructor(config: any) {

        if (config.url == null) {
            config.url = UriHelper.getRestUri('content/createAttachment');
        }
        if (config.selfIsDropzone == null) {
            config.selfIsDropzone = true;
        }

        super(config);

        this.attachmentItems = [];

        if (config.attachmentRemoveCallback) {
            this.removeCallback = config.attachmentRemoveCallback;
        }

        if (config.attachmentAddCallback) {
            this.addCallback = config.attachmentAddCallback;
        }

        const noAttachmentsDescription = new DivEl('no-attachments-description');
        noAttachmentsDescription.setHtml('< ' + i18n('field.content.noattachment') + ' >');
        noAttachmentsDescription.insertAfterEl(this.getResultContainer());

        this.addClass('attachment-uploader-el');
    }

    createModel(serverResponse: AttachmentJson): Attachment {
        if (serverResponse) {
            return new AttachmentBuilder().fromJson(serverResponse).build();
        } else {
            return null;
        }
    }

    getModelValue(item: Attachment): string {
        return item.getName().toString();
    }

    removeAttachmentItem(value: string) {
        this.attachmentItems = this.attachmentItems.filter(
            item => !(item.getValue() === value)
        );
    }

    getExistingItem(value: string): Element {
        let element = null;
        this.getResultContainer().getChildren().forEach((item) => {
            if ((<AttachmentItem>item).getValue() === value) {
                element = item;
            }
        });
        return element;
    }

    createResultItem(value: string): Element {

        let attachmentItem = new AttachmentItem(this.contentId, value, this.removeCallback);
        this.attachmentItems.push(attachmentItem);

        if (this.addCallback) {
            this.addCallback(attachmentItem.getValue());
        }

        return attachmentItem;
    }

    maximumOccurrencesReached(): boolean {
        if (this.config.maximumOccurrences) {
            return this.attachmentItems.length >= this.config.maximumOccurrences;
        }
        return false;
    }
}
