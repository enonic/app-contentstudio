import * as Q from 'q';
import {Input} from 'lib-admin-ui/form/Input';
import {InputTypeManager} from 'lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from 'lib-admin-ui/Class';
import {PropertyArray} from 'lib-admin-ui/data/PropertyArray';
import {ValueTypes} from 'lib-admin-ui/data/ValueTypes';
import {UploadedEvent} from 'lib-admin-ui/ui/uploader/UploadedEvent';
import {FileUploader} from './FileUploader';
import {FileUploaderEl} from '../ui/upload/FileUploaderEl';
import {MediaUploaderElOperation} from '../ui/upload/MediaUploaderEl';
import {AttachmentUploaderEl} from '../ui/upload/AttachmentUploaderEl';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {ContentRequiresSaveEvent} from '../../event/ContentRequiresSaveEvent';
import {Attachment} from '../../attachment/Attachment';
import {DeleteAttachmentRequest} from '../../resource/DeleteAttachmentRequest';
import {Content} from '../../content/Content';
import {showFeedback} from 'lib-admin-ui/notify/MessageBus';
import {ValueTypeConverter} from 'lib-admin-ui/data/ValueTypeConverter';

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
                showFeedback(`"${attachment.getName().toString()}" uploaded`);
            });

            this.uploaderEl.onUploadCompleted(() => {
                this.validate(false);
                this.uploadButton.getEl().setDisabled(false);
                new ContentRequiresSaveEvent(this.getContext().content.getContentId()).fire();
            });

            this.uploaderEl.onUploadFailed(() => {
                this.uploaderEl.setProgressVisible(false);
                this.uploaderWrapper.addClass('empty');
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
            operation: MediaUploaderElOperation.update,
            name: this.getContext().input.getName(),
            showCancel: false,
            allowMultiSelection: this.getInput().getOccurrences().getMaximum() !== 1,
            hideDefaultDropZone: !!(<any>(this.config.inputConfig)).hideDropZone,
            deferred: true,
            maximumOccurrences: this.getInput().getOccurrences().getMaximum(),
            attachmentRemoveCallback: this.removeItemCallback.bind(this),
            attachmentAddCallback: this.addItemCallback.bind(this),
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
        this.uploadButton.setVisible(!(<AttachmentUploaderEl>this.uploaderEl).maximumOccurrencesReached());
    }

}

InputTypeManager.register(new Class('AttachmentUploader', AttachmentUploader));
