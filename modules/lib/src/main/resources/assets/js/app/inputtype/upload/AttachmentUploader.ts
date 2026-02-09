import Q from 'q';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from '@enonic/lib-admin-ui/Class';
import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {UploadedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadedEvent';
import {UploadFailedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadFailedEvent';
import {AttachmentUploaderEl, AttachmentUploaderElConfig} from '../ui/upload/AttachmentUploaderEl';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {ContentRequiresSaveEvent} from '../../event/ContentRequiresSaveEvent';
import {Attachment} from '../../attachment/Attachment';
import {DeleteAttachmentRequest} from '../../resource/DeleteAttachmentRequest';
import {Content} from '../../content/Content';
import {showError, showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {ValueTypeConverter} from '@enonic/lib-admin-ui/data/ValueTypeConverter';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {BaseInputTypeManagingAdd} from '@enonic/lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Page} from '../../page/Page';
import {ValidationError} from '@enonic/lib-admin-ui/ValidationError';
import {InputValidationRecording} from '@enonic/lib-admin-ui/form/inputtype/InputValidationRecording';
import {AttachmentItem} from '../ui/upload/AttachmentItem';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/form/inputtype/ValueChangedEvent';
import {PageHelper} from '../../util/PageHelper';

export class AttachmentUploader
    extends BaseInputTypeManagingAdd {

    declare protected context: ContentInputTypeViewContext;

    private uploadButton: Button;

    private uploaderWrapper: DivEl;

    private uploaderEl: AttachmentUploaderEl;

    private hasAttachmentErrors: boolean;

    constructor(context: ContentInputTypeViewContext) {
        super(context, 'file-uploader');
        this.addClass('attachment-uploader');
    }

    createDefaultValue(rawValue: unknown): Value {
        return this.getValueType().newNullValue();
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    newInitialValue(): Value {
        return null;
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        return super.update(propertyArray, unchangedOnly).then(() => {
            this.doRefresh();
            this.notifyValueChanged(new ValueChangedEvent(null, -1));
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

            this.appendChild(this.uploaderWrapper);

            this.doRefresh();
            this.setLayoutInProgress(false);

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
                id: this.context.content.getContentId().toString()
            },
            contentId: this.context.content.getContentId().toString(),
            name: this.context.input.getName(),
            showCancel: false,
            allowMultiSelection: this.getInput().getOccurrences().getMaximum() !== 1,
            hideDefaultDropZone: !!this.context.inputConfig.hideDropZone,
            deferred: true,
            attachmentRemoveCallback: this.removeItemCallback.bind(this),
            getTotalAllowedToUpload: this.getTotalAllowedToUpload.bind(this),
            hasUploadButton: false,
            project: this.context.project
        };
    }

    private removeItemCallback(attachmentName: string) {
        this.toggleUploadButtonVisibility();

        this.deleteAttachmentIfNotUsed(attachmentName).then(() => {
            const values: string[] = this.getFileNamesFromProperty();
            const index: number = values.indexOf(attachmentName);
            this.getPropertyArray().remove(index);

            new ContentRequiresSaveEvent(this.context.content.getContentId()).fire();
        }).catch(DefaultErrorHandler.handle);
    }

    private deleteAttachmentIfNotUsed(attachmentName: string): Q.Promise<void> {
        return this.isAttachmentInUse(attachmentName) ? Q() : this.deleteAttachment(attachmentName);
    }

    private isAttachmentInUse(attachmentName: string): boolean {
        if (this.isAttachmentReferencedFromContent()) {
            return true;
        }

        if (this.isAttachmentReferencedFromPage(attachmentName)) {
            return true;
        }

        return false;
    }

    private isAttachmentReferencedFromContent() {
        return false;
    }

    private isAttachmentReferencedFromPage(attachmentName: string): boolean {
        if (!this.context.content.isPage()) {
            return false;
        }

        const content: Content = this.context.content as Content;
        const page: Page = content.getPage();

        if (!page.hasNonEmptyRegions()) {
            return false;
        }

        const attachmentInputName: string = this.getInput().getName();

        return PageHelper.getPropertyValueUsageCount(page, attachmentInputName, attachmentName) > 1;
    }

    private deleteAttachment(itemName: string): Q.Promise<void> {
        return new DeleteAttachmentRequest()
            .setContentId(this.context.content.getContentId())
            .setRequestProject(this.context.project)
            .addAttachmentName(itemName)
            .sendAndParse()
            .then(Q);
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
        let uploadedItemsNames: string[] = [];

        this.uploaderEl.onUploadStarted(() => {
            uploadedItemsNames = [];
            this.uploaderWrapper.removeClass('empty');
            this.uploadButton.setEnabled(false);
        });

        this.uploaderEl.onFileUploaded((event: UploadedEvent<Attachment>) => {
            const attachment: Attachment = event.getUploadItem().getModel();
            uploadedItemsNames.push(attachment.getName().toString());

            showFeedback(i18n('notify.upload.success', attachment.getName().toString()));
        });

        this.uploaderEl.onUploadCompleted(() => {
            this.validate(false);
            this.uploadButton.setEnabled(true);

            uploadedItemsNames.forEach((itemName: string) => {
                this.addFileNameToProperty(itemName);
            });

            this.doRefresh();

            new ContentRequiresSaveEvent(this.context.content.getContentId()).fire();
        });

        this.uploaderEl.onUploadFailed((event: UploadFailedEvent<Attachment>) => {
            this.uploaderEl.setProgressVisible(false);
            this.uploaderWrapper.addClass('empty');
            this.uploadButton.setEnabled(true);
            showError(i18n('notify.upload.failure', event.getUploadItem().getFileName()));
        });
    }

    private addFileNameToProperty(fileName: string) {
        const value: Value = new Value(fileName, ValueTypes.STRING);

        if (!this.getPropertyArray().containsValue(value)) {
            this.ignorePropertyChange(true);
            this.getPropertyArray().add(value);
            this.ignorePropertyChange(false);
        }
    }

    private doRefresh() {
        this.updateSelectedValues();
        this.toggleUploadButtonVisibility();
        this.validate(false);
    }

    public giveFocus(): boolean {
        if (this.uploaderEl) {
            return this.uploaderEl.giveFocus();
        }
        return false;
    }

    protected getNumberOfValids(): number {
        const attachmentNamesWithErrors: string[] = this.getAttachmentNamesFromCustomErrors();

        if (attachmentNamesWithErrors.length === 0) {
            return this.getPropertyArray().getProperties().length;
        }

        return this.getFileNamesFromProperty().filter(
            (attachedName: string) => !attachmentNamesWithErrors.some((e: string) => e === attachedName)).length;
    }

    private getCustomValidationErrors(): ValidationError[] {
        return this.context.formContext.getPersistedContent().getValidationErrors();
    }

    private getAttachmentNamesFromCustomErrors(): string[] {
        return this.getAttachmentErrors().map((attachmentError: ValidationError) => attachmentError.getAttachment());
    }

    private getAttachmentErrors(): ValidationError[] {
        return this.getCustomValidationErrors().filter((error: ValidationError) => error.getAttachment());
    }

    protected doValidate(): InputValidationRecording {
        const recording: InputValidationRecording = super.doValidate();

        const attachmentErrors: ValidationError[] = this.getAttachmentErrors();
        this.hasAttachmentErrors = false;

        if (attachmentErrors.length > 0) {
            let hasError: boolean = false;

            attachmentErrors.forEach((attWithError: ValidationError) => {
                this.uploaderEl.getAttachedItems().forEach((attachmentItem: AttachmentItem) => {
                    if (attachmentItem.getValue() === attWithError.getAttachment()) {
                        attachmentItem.addClass('invalid');
                        attachmentItem.setError(attWithError.getMessage());
                        hasError = true;
                    }
                });
            });

            this.toggleClass('invalid', hasError);
            this.hasAttachmentErrors = hasError;

            if (hasError) {
                if (this.isSingleOccurrence()) {
                    return this.createValidationRecordForSingleInvalidOccurrence();
                } else {
                    recording.setErrorMessage(i18n('validation.attachment.invalid'));
                }
            }
        }

        return recording;
    }

    private isSingleOccurrence(): boolean {
        return this.input.getOccurrences().getMinimum() === 1 && this.input.getOccurrences().getMaximum() === 1;
    }

    private createValidationRecordForSingleInvalidOccurrence(): InputValidationRecording {
        const recording = new InputValidationRecording(this.input.getOccurrences(), 1);
        recording.setErrorMessage(i18n('validation.attachment.invalid'));
        return recording;
    }

    hasValidUserInput(): boolean {
        return !this.hasAttachmentErrors;
    }

    hideValidationDetailsByDefault(): boolean {
        return true;
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
