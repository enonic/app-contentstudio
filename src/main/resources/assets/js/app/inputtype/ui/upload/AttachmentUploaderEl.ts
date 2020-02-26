import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {AttachmentItem} from './AttachmentItem';
import {Attachment, AttachmentBuilder} from '../../../attachment/Attachment';
import {AttachmentJson} from '../../../attachment/AttachmentJson';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {UploaderEl, UploaderElConfig} from 'lib-admin-ui/ui/uploader/UploaderEl';
import * as Q from 'q';

export interface AttachmentItems {
    existingItems: Element[];

    newItems: Element[];
}

export interface AttachmentUploaderElConfig
    extends UploaderElConfig {

    contentId: string;

    attachmentRemoveCallback: (value: any) => void;
}

export class AttachmentUploaderEl
    extends UploaderEl<Attachment> {

    static FILE_NAME_DELIMITER: string = '/';

    private contentId: string;

    private removeCallback: (value: string) => void;

    constructor(config: AttachmentUploaderElConfig) {
        if (config.url == null) {
            config.url = UriHelper.getRestUri('content/createAttachment');
        }
        if (config.selfIsDropzone == null) {
            config.selfIsDropzone = true;
        }

        super(config);

        if (config.attachmentRemoveCallback) {
            this.removeCallback = config.attachmentRemoveCallback;
        }

        this.contentId = config.contentId;
    }

    doSetValue(value: string): AttachmentUploaderEl {
        const items: AttachmentItems = this.getAttachmentItemsFromString(value);
        this.appendNewItems(items.newItems);
        this.refreshVisibility();

        return this;
    }

    setValues(values: string[]) {
        const items: AttachmentItems = this.getAttachmentItems(values);
        this.removeAllChildrenExceptGiven(items.existingItems);
        this.appendNewItems(items.newItems);
        this.refreshVisibility();
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

    private getAttachmentItemsFromString(valuesAsString: string): AttachmentItems {
        const newItems: Element[] = [];
        const existingItems: Element[] = [];

        this.parseValues(valuesAsString).forEach((parsedValue: string) => {
            if (parsedValue) {
                const newValues: string[] = parsedValue.split(AttachmentUploaderEl.FILE_NAME_DELIMITER);
                const items: AttachmentItems = this.getAttachmentItems(newValues);
                newItems.push(...items.newItems);
                existingItems.push(...items.existingItems);
            }
        });

        return {existingItems, newItems};
    }

    private getAttachmentItems(values: string[]): AttachmentItems {
        const newItems: Element[] = [];
        const existingItems: Element[] = [];

        values.forEach((value: string) => {
            const existingItem: AttachmentItem = this.getExistingItem(value);
            if (!existingItem) {
                newItems.push(this.createResultItem(value));
            } else {
                existingItems.push(existingItem);
            }
        });


        return {existingItems, newItems};
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
        attachmentItem.onRemoveClicked(this.removeCallback);

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
