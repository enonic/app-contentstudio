import * as Q from 'q';
import {Input} from 'lib-admin-ui/form/Input';
import {InputTypeManager} from 'lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from 'lib-admin-ui/Class';
import {PropertyArray} from 'lib-admin-ui/data/PropertyArray';
import {ValueTypes} from 'lib-admin-ui/data/ValueTypes';
import {UploadedEvent} from 'lib-admin-ui/ui/uploader/UploadedEvent';
import {UploadFailedEvent} from 'lib-admin-ui/ui/uploader/UploadFailedEvent';
import {FileUploader} from './FileUploader';
import {FileUploaderEl} from '../ui/upload/FileUploaderEl';
import {AttachmentUploaderEl} from '../ui/upload/AttachmentUploaderEl';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {ContentRequiresSaveEvent} from '../../event/ContentRequiresSaveEvent';
import {Attachment} from '../../attachment/Attachment';
import {DeleteAttachmentRequest} from '../../resource/DeleteAttachmentRequest';
import {Content} from '../../content/Content';
import {showError, showFeedback} from 'lib-admin-ui/notify/MessageBus';
import {ValueTypeConverter} from 'lib-admin-ui/data/ValueTypeConverter';
import {i18n} from 'lib-admin-ui/util/Messages';

export class AttachmentUploader
    extends FileUploader {

    constructor(config: ContentInputTypeViewContext) {
        super(config);
        this.addClass('attachment-uploader');
        this.config = config;
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        if (!ValueTypes.STRING.equals(propertyArray.getType())) {
            propertyArray.convertValues(ValueTypes.STRING, ValueTypeConverter.convertTo);
        }

        return super.layout(input, propertyArray).then(() => {
            this.uploaderEl = this.createUploader();
            this.uploaderWrapper = this.createUploaderWrapper();

            this.update(propertyArray).done();

            this.uploaderEl.onUploadStarted(() => {
                this.uploaderWrapper.removeClass('empty');
                this.uploadButton.getEl().setDisabled(true);
            });

            this.uploaderEl.onFileUploaded((event: UploadedEvent<Attachment>) => {
                const attachment: Attachment = <Attachment>event.getUploadItem().getModel();
                this.setFileNameProperty(attachment.getName().toString());
                showFeedback(i18n('notify.upload.success', attachment.getName().toString()));
            });

            this.uploaderEl.onUploadCompleted(() => {
                this.validate(false);
                this.uploadButton.getEl().setDisabled(false);
                new ContentRequiresSaveEvent(this.getContext().content.getContentId()).fire();
            });

            this.uploaderEl.onUploadFailed((event: UploadFailedEvent<Attachment>) => {
                this.uploaderEl.setProgressVisible(false);
                this.uploaderWrapper.addClass('empty');
                this.uploadButton.getEl().setDisabled(false);
                showError(i18n('notify.upload.failure', event.getUploadItem().getFileName()));
            });

            this.appendChild(this.uploaderWrapper);

            this.setLayoutInProgress(false);
            this.validate(false);

            return Q<void>(null);
        });
    }

    public giveFocus(): boolean {
        if (this.uploaderEl) {
            return this.uploaderEl.giveFocus();
        }
        return false;
    }

    protected getNumberOfValids(): number {
        return this.getPropertyArray().getProperties().length;
    }

    protected createUploader(): FileUploaderEl<any> {

        return new AttachmentUploaderEl({
            params: {
                id: this.getContext().content.getContentId().toString()
            },
            name: this.getContext().input.getName(),
            showCancel: false,
            allowMultiSelection: this.getInput().getOccurrences().getMaximum() !== 1,
            hideDefaultDropZone: !!(<any>(this.config.inputConfig)).hideDropZone,
            deferred: true,
            attachmentRemoveCallback: this.removeItemCallback.bind(this),
            attachmentAddCallback: this.addItemCallback.bind(this),
            getTotalAllowedToUpload: this.getTotalAllowedToUpload.bind(this),
            hasUploadButton: false
        });
    }

    private removeItemCallback(itemName: string) {
        const values = this.getFileNamesFromProperty(this.getPropertyArray());

        const index = values.indexOf(itemName);
        values.splice(index, 1);

        (<AttachmentUploaderEl>this.uploaderEl).removeAttachmentItem(itemName);
        this.getPropertyArray().remove(index);

        this.updateOccurrences();

        new DeleteAttachmentRequest()
            .setContentId(this.getContext().content.getContentId())
            .addAttachmentName(itemName)
            .sendAndParse()
            .then((content: Content) => {
                new ContentRequiresSaveEvent(content.getContentId()).fire();
            });
    }

    private addItemCallback() {
        this.updateOccurrences();
    }

    private updateOccurrences() {
        this.uploadButton.setVisible(this.isUploadAllowed());
    }

    private isUploadAllowed(): boolean {
        return this.getTotalAllowedToUpload() > 0;
    }

    private getTotalAllowedToUpload(): number {
        return this.getInput().getOccurrences().getMaximum() - (<AttachmentUploaderEl>this.uploaderEl).getTotalItems();
    }
}

InputTypeManager.register(new Class('AttachmentUploader', AttachmentUploader));
