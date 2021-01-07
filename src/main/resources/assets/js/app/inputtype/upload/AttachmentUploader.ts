import * as Q from 'q';
import {Input} from 'lib-admin-ui/form/Input';
import {InputTypeManager} from 'lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from 'lib-admin-ui/Class';
import {PropertyArray} from 'lib-admin-ui/data/PropertyArray';
import {ValueTypes} from 'lib-admin-ui/data/ValueTypes';
import {UploadedEvent} from 'lib-admin-ui/ui/uploader/UploadedEvent';
import {UploadFailedEvent} from 'lib-admin-ui/ui/uploader/UploadFailedEvent';
import {AttachmentUploaderEl, AttachmentUploaderElConfig} from '../ui/upload/AttachmentUploaderEl';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {ContentRequiresSaveEvent} from '../../event/ContentRequiresSaveEvent';
import {Attachment} from '../../attachment/Attachment';
import {DeleteAttachmentRequest} from '../../resource/DeleteAttachmentRequest';
import {Content} from '../../content/Content';
import {showError, showFeedback} from 'lib-admin-ui/notify/MessageBus';
import {ValueTypeConverter} from 'lib-admin-ui/data/ValueTypeConverter';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {Value} from 'lib-admin-ui/data/Value';
import {ValueType} from 'lib-admin-ui/data/ValueType';
import {BaseInputTypeManagingAdd} from 'lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {AfterContentSavedEvent} from '../../event/AfterContentSavedEvent';

export class AttachmentUploader
    extends BaseInputTypeManagingAdd {

    private uploadButton: DivEl;

    private uploaderWrapper: DivEl;

    private uploaderEl: AttachmentUploaderEl;

    private config: ContentInputTypeViewContext;

    private skipServerEvents: boolean;

    constructor(config: ContentInputTypeViewContext) {
        super('file-uploader');
        this.addClass('attachment-uploader');
        this.config = config;
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    newInitialValue(): Value {
        return null;
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        return super.update(propertyArray, unchangedOnly).then(() => {
            if (!this.skipServerEvents) {
                this.updateSelectedValues();
                this.toggleUploadButtonVisibility();
                this.validate(false);
            }
        });
    }

    private updateSelectedValues() {
        const fileNames: string[] = this.getFileNamesFromProperty();
        this.uploaderEl.setValue(fileNames && fileNames.length > 0 ? JSON.stringify(fileNames) : null);
    }

    private getFileNamesFromProperty(): string[] {
        return this.getPropertyArray().getProperties().map((property) => {
            if (property.hasNonNullValue()) {
                return property.getString();
            }
        });
    }

    private toggleUploadButtonVisibility() {
        this.uploadButton.setVisible(this.isUploadAllowed());
    }

    private isUploadAllowed(): boolean {
        return this.getTotalAllowedToUpload() > 0;
    }

    private getTotalAllowedToUpload(): number {
        const maxOccurrences: number = this.getInput().getOccurrences().getMaximum();

        if (maxOccurrences === 0) {
            return Number.MAX_SAFE_INTEGER;
        }

        return maxOccurrences - this.uploaderEl.getTotalItems();
    }

    reset() {
        this.uploaderEl.resetBaseValues();
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        if (!ValueTypes.STRING.equals(propertyArray.getType())) {
            propertyArray.convertValues(ValueTypes.STRING, ValueTypeConverter.convertTo);
        }

        return super.layout(input, propertyArray).then(() => {
            this.initElements();
            this.initElementListeners();
            this.updateSelectedValues();
            this.toggleUploadButtonVisibility();

            this.appendChild(this.uploaderWrapper);

            this.setLayoutInProgress(false);
            this.validate(false);

            return Q<void>(null);
        });
    }

    private initElements() {
        this.uploaderEl = new AttachmentUploaderEl(this.createUploaderConfig());
        this.uploaderWrapper = this.createUploaderWrapper();
    }

    private createUploaderConfig(): AttachmentUploaderElConfig {
        return {
            params: {
                id: this.config.content.getContentId().toString()
            },
            contentId: this.config.content.getContentId().toString(),
            name: this.config.input.getName(),
            showCancel: false,
            allowMultiSelection: this.getInput().getOccurrences().getMaximum() !== 1,
            hideDefaultDropZone: !!(<any>(this.config.inputConfig)).hideDropZone,
            deferred: true,
            attachmentRemoveCallback: this.removeItemCallback.bind(this),
            getTotalAllowedToUpload: this.getTotalAllowedToUpload.bind(this),
            hasUploadButton: false
        };
    }

    private removeItemCallback(itemName: string) {
        const values: string[] = this.getFileNamesFromProperty();
        const index: number = values.indexOf(itemName);
        this.getPropertyArray().remove(index);

        this.toggleUploadButtonVisibility();

        new DeleteAttachmentRequest()
            .setContentId(this.config.content.getContentId())
            .addAttachmentName(itemName)
            .sendAndParse()
            .then((content: Content) => {
                new ContentRequiresSaveEvent(content.getContentId()).fire();
            }).catch(DefaultErrorHandler.handle);
    }

    private createUploaderWrapper(): DivEl {
        const wrapper: DivEl = new DivEl('uploader-wrapper');

        wrapper.appendChild(this.uploaderEl);

        if (this.uploaderEl.hasUploadButton()) {
            this.uploadButton = this.uploaderEl.getUploadButton();
        } else {
            this.uploadButton = new Button();
            this.uploadButton.addClass('upload-button');
            wrapper.appendChild(this.uploadButton);

            this.uploadButton.onClicked(() => this.uploaderEl.showFileSelectionDialog());
        }

        return wrapper;
    }

    private initElementListeners() {
        this.uploaderEl.onUploadStarted(() => {
            this.uploaderWrapper.removeClass('empty');
            this.uploadButton.getEl().setDisabled(true);
            this.stopListenServerEvents();
        });

        this.uploaderEl.onFileUploaded((event: UploadedEvent<Attachment>) => {
            const attachment: Attachment = <Attachment>event.getUploadItem().getModel();
            this.addFileNameToProperty(attachment.getName().toString());

            showFeedback(i18n('notify.upload.success', attachment.getName().toString()));
        });

        this.uploaderEl.onUploadCompleted(() => {
            this.validate(false);
            this.uploadButton.getEl().setDisabled(false);

            AfterContentSavedEvent.on(this.startListenServerEvents.bind(this));
            new ContentRequiresSaveEvent(this.config.content.getContentId()).fire();
        });

        this.uploaderEl.onUploadFailed((event: UploadFailedEvent<Attachment>) => {
            this.uploaderEl.setProgressVisible(false);
            this.uploaderWrapper.addClass('empty');
            this.uploadButton.getEl().setDisabled(false);
            showError(i18n('notify.upload.failure', event.getUploadItem().getFileName()));
        });
    }

    private stopListenServerEvents() {
        this.skipServerEvents = true;
    }

    private startListenServerEvents() {
        AfterContentSavedEvent.un(this.startListenServerEvents.bind(this));
        this.skipServerEvents = false;
    }

    private addFileNameToProperty(fileName: string) {
        const value: Value = new Value(fileName, ValueTypes.STRING);

        if (!this.getPropertyArray().containsValue(value)) {
            this.ignorePropertyChange = true;
            this.getPropertyArray().add(value);
            this.ignorePropertyChange = false;
        }
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

    setEnabled(enable: boolean): void {
        this.uploaderEl.setEnabled(enable);

    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.uploaderEl.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.uploaderEl.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.uploaderEl.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.uploaderEl.unBlur(listener);
    }
}

InputTypeManager.register(new Class('AttachmentUploader', AttachmentUploader));
