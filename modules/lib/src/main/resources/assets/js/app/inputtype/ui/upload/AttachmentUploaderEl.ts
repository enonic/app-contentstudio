import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {AttachmentItem} from './AttachmentItem';
import {Attachment, AttachmentBuilder} from '../../../attachment/Attachment';
import {AttachmentJson} from '../../../attachment/AttachmentJson';
import {UploaderEl, UploaderElConfig} from 'lib-admin-ui/ui/uploader/UploaderEl';
import * as Q from 'q';
import {UrlHelper} from '../../../util/UrlHelper';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ContentPath} from '../../../content/ContentPath';

export interface AttachmentUploaderElConfig
    extends UploaderElConfig {

    contentId: string;

    attachmentRemoveCallback: (value: any) => void;
}

export class AttachmentUploaderEl
    extends UploaderEl<Attachment> {

    private readonly contentId: string;

    private readonly removeCallback: (value: string) => void;

    private attachedItems: AttachmentItem[];

    constructor(config: AttachmentUploaderElConfig) {
        if (config.url == null) {
            config.url = 'content/createAttachment';
        }

        if (config.selfIsDropzone == null) {
            config.selfIsDropzone = true;
        }

        super(config);

        if (config.attachmentRemoveCallback) {
            this.removeCallback = config.attachmentRemoveCallback;
        }

        this.contentId = config.contentId;
        this.attachedItems = [];
    }

    protected beforeSubmit() {
        this.uploader.setEndpoint(UrlHelper.getCmsRestUri(`${UrlHelper.getCMSPath(ContentPath.CONTENT_ROOT)}/${this.config.url}`));
    }

    protected doSetValue(value: string): AttachmentUploaderEl {
        super.doSetValue(value);
        this.refreshVisibility();

        if (StringHelper.isEmpty(value)) {
            this.attachedItems.forEach((item: AttachmentItem) => item.remove());
            this.attachedItems = [];
        }

        return this;
    }

    protected initHandler() {
        if (!this.config.disabled) {
            if (!this.uploader && this.config.url) {
                this.uploader = this.initUploader();
            }
        }
    }

    private refreshVisibility() {
        if (this.config.showResult) {
            this.setResultVisible();
            this.getDefaultDropzoneContainer().setVisible(false);
            this.getDropzone().setVisible(false);
        } else {
            this.setDefaultDropzoneVisible();
        }
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

    getExistingItem(value: string): AttachmentItem {
        let element: AttachmentItem = null;
        this.getResultContainer().getChildren().forEach((item: AttachmentItem) => {
            if (item.getValue() === value) {
                element = item;
            }
        });

        return element;
    }

    createResultItem(value: string): AttachmentItem {
        const attachmentItem: AttachmentItem = new AttachmentItem(this.contentId, value);
        this.attachedItems.push(attachmentItem);

        attachmentItem.onRemoveClicked(this.removeCallback);
        attachmentItem.onRemoveClicked(() =>  {
            this.attachedItems = this.attachedItems.filter((item: AttachmentItem) => item !== attachmentItem);
        });

        return attachmentItem;
    }

    getTotalItems(): number {
        return this.getResultContainer().getChildren().length;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('attachment-uploader-el');

            const noAttachmentsDescription = new DivEl('no-attachments-description');
            noAttachmentsDescription.setHtml('< ' + i18n('field.content.noattachment') + ' >');
            noAttachmentsDescription.insertAfterEl(this.getResultContainer());

            return rendered;
        });
    }
}
