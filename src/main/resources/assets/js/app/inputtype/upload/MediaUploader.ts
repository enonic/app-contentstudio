import Property = api.data.Property;
import Value = api.data.Value;
import ValueType = api.data.ValueType;
import ValueTypes = api.data.ValueTypes;
import UploadedEvent = api.ui.uploader.UploadedEvent;
import {MediaUploaderEl, MediaUploaderElOperation} from '../ui/upload/MediaUploaderEl';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {Content} from '../../content/Content';
import {ContentImageUrlResolver} from '../../content/ContentImageUrlResolver';

export interface MediaUploaderConfigAllowType {
    name: string;
    extensions: string;
}

export class MediaUploader
    extends api.form.inputtype.support.BaseInputTypeSingleOccurrence {
    private config: ContentInputTypeViewContext;
    private mediaUploaderEl: MediaUploaderEl;
    private uploaderWrapper: api.dom.DivEl;
    private svgImage: api.dom.ImgEl;

    constructor(config: ContentInputTypeViewContext) {
        super(config, 'media-uploader');
        this.config = config;
    }

    getContext(): ContentInputTypeViewContext {
        return <ContentInputTypeViewContext>super.getContext();
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    newInitialValue(): Value {
        return ValueTypes.STRING.newNullValue();
    }

    layoutProperty(_input: api.form.Input, property: Property): wemQ.Promise<void> {
        if (!ValueTypes.STRING.equals(property.getType()) && !ValueTypes.DATA.equals(property.getType())) {
            property.convertValueType(ValueTypes.STRING);
        }
        this.mediaUploaderEl = this.createUploader(property);

        this.uploaderWrapper = this.createUploaderWrapper(property);

        this.updateProperty(property).done();

        this.mediaUploaderEl.onUploadStarted(() => {
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

            api.notify.showFeedback(`"${fileName}" uploaded`);

            this.manageSVGImageIfPresent(content);
        });

        this.mediaUploaderEl.onUploadFailed(() => {
            this.mediaUploaderEl.setProgressVisible(false);
            this.uploaderWrapper.addClass('empty');
        });

        this.mediaUploaderEl.onUploadReset(() => {
            this.mediaUploaderEl.setFileName('');

            switch (property.getType()) {
            case ValueTypes.DATA:
                property.getPropertySet().setProperty('attachment', 0, ValueTypes.STRING.newNullValue());
                break;
            case ValueTypes.STRING:
                property.setValue(ValueTypes.STRING.newNullValue());
                break;
            }
        });

        this.appendChild(this.uploaderWrapper);

        this.createSvgImageWrapperIfNeeded();

        return wemQ<void>(null);
    }

    validate(): api.form.inputtype.InputValidationRecording {
        return new api.form.inputtype.InputValidationRecording();
    }

    updateProperty(property: Property, unchangedOnly?: boolean): wemQ.Promise<void> {
        if ((!unchangedOnly || !this.mediaUploaderEl.isDirty()) && this.getContext().content.getContentId()) {

            this.mediaUploaderEl.setValue(this.getContext().content.getContentId().toString());

            if (property.hasNonNullValue()) {
                this.mediaUploaderEl.setFileName(this.getFileNameFromProperty(property));
            }
        } else if (this.mediaUploaderEl.isDirty()) {
            this.mediaUploaderEl.forceChangedEvent();
        }
        return wemQ<void>(null);
    }

    reset() {
        this.mediaUploaderEl.resetBaseValues();
    }

    private manageSVGImageIfPresent(content: Content) {
        if (content.getType().isVectorMedia()) {
            this.addClass('with-svg-image');
            let imgUrl = new ContentImageUrlResolver().setContentId(
                this.getContext().content.getContentId()).setTimestamp(
                content.getModifiedTime()).resolve();

            this.svgImage.setSrc(imgUrl);
        } else {
            this.removeClass('with-svg-image');
        }
    }

    private getFileNameFromProperty(property: Property): string {
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
                !api.util.StringHelper.isEmpty(property.getPropertySet().getString('attachment')));
    }

    private getAllowTypeFromFileName(fileName: string): MediaUploaderConfigAllowType[] {
        return [{name: 'Media', extensions: this.getFileExtensionFromFileName(fileName)}];
    }

    private createSvgImageWrapperIfNeeded() {
        if (this.config.formContext.getContentTypeName().isVectorMedia()) {
            this.svgImage = new api.dom.ImgEl();
            this.addClass('with-svg-image');

            let content = this.config.formContext.getPersistedContent();

            let imgUrl = new ContentImageUrlResolver().setContentId(
                this.getContext().content.getContentId()).setTimestamp(
                content.getModifiedTime()).resolve();

            this.svgImage.setSrc(imgUrl);

            this.appendChild(new api.dom.DivEl('svg-image-wrapper').appendChild(this.svgImage));

            // need to call it manually as svg images are uploaded too quickly
            this.svgImage.onLoaded(() => this.mediaUploaderEl.setResultVisible(true));
        }
    }

    private createUploaderWrapper(property: Property): api.dom.DivEl {
        let wrapper = new api.dom.DivEl('uploader-wrapper');

        let uploadButton = new api.ui.button.Button();
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
        let attachmentFileName = this.getFileNameFromProperty(property);

        if (this.propertyAlreadyHasAttachment(property)) {
            predefinedAllowTypes = this.getAllowTypeFromFileName(attachmentFileName);
        }

        let allowTypesConfig: MediaUploaderConfigAllowType[] = predefinedAllowTypes ||
                                                               (<any>(this.config.inputConfig)).allowExtensions ||
            [];
        let allowExtensions = allowTypesConfig.map((allowType: MediaUploaderConfigAllowType) => {
            return {title: allowType.name, extensions: allowType.extensions};
        });

        let hideDropZone = (<any>(this.config.inputConfig)).hideDropZone;

        return new MediaUploaderEl({
            params: {
                content: this.getContext().content.getContentId().toString()
            },
            operation: MediaUploaderElOperation.update,
            allowExtensions: allowExtensions,
            name: this.getContext().input.getName(),
            maximumOccurrences: 1,
            allowMultiSelection: false,
            hideDefaultDropZone: hideDropZone != null ? hideDropZone : true,
            deferred: true,
            hasUploadButton: false
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

api.form.inputtype.InputTypeManager.register(new api.Class('MediaUploader', MediaUploader));
