import * as Q from 'q';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from '@enonic/lib-admin-ui/Class';
import {Property} from '@enonic/lib-admin-ui/data/Property';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {UploadedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadedEvent';
import {MediaUploaderEl, MediaUploaderElOperation} from '../ui/upload/MediaUploaderEl';
import {BaseInputTypeSingleOccurrence} from '@enonic/lib-admin-ui/form/inputtype/support/BaseInputTypeSingleOccurrence';
import {ImgEl} from '@enonic/lib-admin-ui/dom/ImgEl';
import {ValueTypeConverter} from '@enonic/lib-admin-ui/data/ValueTypeConverter';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {Content} from '../../content/Content';
import {ImageUrlResolver} from '../../util/ImageUrlResolver';
import {ContentRequiresSaveEvent} from '../../event/ContentRequiresSaveEvent';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentId} from '../../content/ContentId';

export interface MediaUploaderConfigAllowType {
    name: string;
    extensions: string;
}

export class MediaUploader
    extends BaseInputTypeSingleOccurrence {
    private config: ContentInputTypeViewContext;
    private mediaUploaderEl: MediaUploaderEl;
    private uploaderWrapper: DivEl;
    private svgImage: ImgEl;

    constructor(config: ContentInputTypeViewContext) {
        super(config, 'media-uploader');
        this.config = config;
    }

    getContext(): ContentInputTypeViewContext {
        return super.getContext() as ContentInputTypeViewContext;
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    newInitialValue(): Value {
        return ValueTypes.STRING.newNullValue();
    }

    layoutProperty(_input: Input, property: Property): Q.Promise<void> {
        if (!ValueTypes.STRING.equals(property.getType()) && !ValueTypes.DATA.equals(property.getType())) {
            property.convertValueType(ValueTypes.STRING, ValueTypeConverter.convertTo);
        }
        this.mediaUploaderEl = this.createUploader(property);

        this.uploaderWrapper = this.createUploaderWrapper(property);

        this.updateProperty(property).done();

        this.mediaUploaderEl.onUploadStarted(() => {
            this.uploaderWrapper.addClass('uploading');
            this.uploaderWrapper.removeClass('empty');
        });

        this.mediaUploaderEl.onFileUploaded((event: UploadedEvent<Content>) => {

            let content = event.getUploadItem().getModel();
            let value = this.mediaUploaderEl.getMediaValue(content);
            let fileName = value.getString();

            this.mediaUploaderEl.setFileName(fileName);

            switch (property.getType()) {
            case ValueTypes.DATA:
                property.getPropertySet().setProperty('attachment', 0, value);
                break;
            case ValueTypes.STRING:
                property.setValue(ValueTypes.STRING.newValue(fileName));
                break;
            }

            showFeedback(`"${fileName}" uploaded`);

            const isVectorMedia = content.getType().isVectorMedia();
            if (isVectorMedia) {
                this.setVectorMediaUrl(content);
            }

            this.toggleClass('with-svg-image', isVectorMedia);
            this.uploaderWrapper.removeClass('uploading');
        });

        this.mediaUploaderEl.onUploadCompleted(() => {
            new ContentRequiresSaveEvent(this.getContext().content.getContentId()).fire();
        });

        this.mediaUploaderEl.onUploadFailed(() => {
            this.mediaUploaderEl.setProgressVisible(false);
            this.uploaderWrapper.addClass('empty');
            this.uploaderWrapper.removeClass('uploading');
        });

        this.mediaUploaderEl.onUploadReset(() => {
            this.mediaUploaderEl.setFileName('');
            this.uploaderWrapper.removeClass('uploading');
        });

        this.appendChild(this.uploaderWrapper);

        if (this.config.formContext.getContentTypeName()?.isVectorMedia()) {
            this.createVectorMediaWrapper();
        }

        return Q<void>(null);
    }

    updateProperty(property: Property, unchangedOnly?: boolean): Q.Promise<void> {
        if ((!unchangedOnly || !this.mediaUploaderEl.isDirty()) && this.getContext().content.getContentId()) {

            this.mediaUploaderEl.setValue(this.getContext().content.getContentId().toString());

            if (property.hasNonNullValue()) {
                this.mediaUploaderEl.setFileName(MediaUploader.getFileNameFromProperty(property));
            }
        } else if (this.mediaUploaderEl.isDirty()) {
            this.mediaUploaderEl.forceChangedEvent();
        }
        return Q<void>(null);
    }

    reset() {
        this.mediaUploaderEl.resetBaseValues();
    }

    static getFileNameFromProperty(property: Property): string {
        if (property.getValue() != null) {
            switch (property.getType()) {
            case ValueTypes.DATA:
                return property.getPropertySet().getString('attachment');
            case ValueTypes.STRING:
                return property.getValue().getString();
            }
        }
        return '';
    }

    private getFileExtensionFromFileName(fileName: string): string {
        return fileName.split('.').pop();
    }

    private propertyAlreadyHasAttachment(property: Property): boolean {
        return (property.getValue() != null &&
                property.getType() === ValueTypes.DATA &&
                !StringHelper.isEmpty(property.getPropertySet().getString('attachment')));
    }

    private getAllowTypeFromFileName(fileName: string): MediaUploaderConfigAllowType[] {
        return [{name: 'Media', extensions: this.getFileExtensionFromFileName(fileName)}];
    }

    private resolveImageUrl(contentId: ContentId): string {
        return new ImageUrlResolver(null, this.config.project)
                    .setContentId(contentId)
                    .setTimestamp(new Date())
                    .resolveForPreview();
    }

    private setVectorMediaUrl(content: ContentSummary) {

        const imgUrl = this.resolveImageUrl(content.getContentId());

        this.svgImage.setSrc(imgUrl);
    }

    private createVectorMediaWrapper() {
        this.svgImage = new ImgEl();
        this.addClass('with-svg-image');

        this.setVectorMediaUrl(this.config.formContext.getPersistedContent());

        this.appendChild(new DivEl('svg-image-wrapper').appendChild(this.svgImage));

        // need to call it manually as svg images are uploaded too quickly
        this.svgImage.onLoaded(() => this.mediaUploaderEl.setResultVisible(true));
    }

    private createUploaderWrapper(property: Property): DivEl {
        let wrapper = new DivEl('uploader-wrapper');

        let uploadButton = new Button();
        uploadButton.addClass('upload-button');

        uploadButton.onClicked(() => {
            if (property.hasNullValue()) {
                return;
            }
            this.mediaUploaderEl.showFileSelectionDialog();
        });

        wrapper.appendChild(this.mediaUploaderEl);
        wrapper.appendChild(uploadButton);

        return wrapper;
    }

    private createUploader(property: Property): MediaUploaderEl {

        let predefinedAllowTypes;
        let attachmentFileName = MediaUploader.getFileNameFromProperty(property);

        if (this.propertyAlreadyHasAttachment(property)) {
            predefinedAllowTypes = this.getAllowTypeFromFileName(attachmentFileName);
        }

        const allowTypesConfig: MediaUploaderConfigAllowType[] = predefinedAllowTypes || this.config.inputConfig.allowExtensions || [];
        const allowExtensions = allowTypesConfig.map((allowType: MediaUploaderConfigAllowType) => {
            return {title: allowType.name, extensions: allowType.extensions};
        });

        return new MediaUploaderEl({
            params: {
                content: this.getContext().content.getContentId().toString()
            },
            operation: MediaUploaderElOperation.update,
            allowExtensions: allowExtensions,
            name: this.getContext().input.getName(),
            allowMultiSelection: false,
            hideDefaultDropZone: !!this.context.inputConfig.hideDropZone,
            deferred: true,
            hasUploadButton: false,
            project: this.config.project
        });
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.mediaUploaderEl.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.mediaUploaderEl.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.mediaUploaderEl.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.mediaUploaderEl.unBlur(listener);
    }
}

InputTypeManager.register(new Class('MediaUploader', MediaUploader));
