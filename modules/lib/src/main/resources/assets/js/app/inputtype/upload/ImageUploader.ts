import Q from 'q';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from '@enonic/lib-admin-ui/Class';
import {Property} from '@enonic/lib-admin-ui/data/Property';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {UploadedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadedEvent';
import {ImageUploaderEl} from '../ui/selector/image/ImageUploaderEl';
import {ImageErrorEvent} from '../ui/selector/image/ImageErrorEvent';
import {MediaUploaderElOperation} from '../ui/upload/MediaUploaderEl';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {GetContentByIdRequest} from '../../resource/GetContentByIdRequest';
import {ImageEditor, Point, Rect} from '../ui/selector/image/ImageEditor';
import {Content} from '../../content/Content';
import {BaseInputTypeSingleOccurrence} from '@enonic/lib-admin-ui/form/inputtype/support/BaseInputTypeSingleOccurrence';
import {InputValidationRecording} from '@enonic/lib-admin-ui/form/inputtype/InputValidationRecording';
import {ValueTypeConverter} from '@enonic/lib-admin-ui/data/ValueTypeConverter';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {InputValidityChangedEvent} from '@enonic/lib-admin-ui/form/inputtype/InputValidityChangedEvent';
import {MediaUploader} from './MediaUploader';

export class ImageUploader
    extends BaseInputTypeSingleOccurrence {

    private imageUploader: ImageUploaderEl;

    private isCropAutoPositioned: boolean;

    private isFocusAutoPositioned: boolean;

    private imageMimeType: string;

    constructor(config: ContentInputTypeViewContext) {
        super(config);
        this.initUploader(config);
        this.addClass('image-uploader-input');
    }

    private initUploader(config: ContentInputTypeViewContext) {
        this.imageUploader = new ImageUploaderEl({
            imageEditorCreatedCallback: this.handleImageEditorCreated.bind(this),
            params: {
                content: config.content.getContentId().toString()
            },
            operation: MediaUploaderElOperation.update,
            name: config.input.getName(),
            hideDefaultDropZone: true,
            selfIsDropzone: false,
            project: config.project
        });

        this.updateImageMimeType(config.content as Content);
        this.imageUploader.getUploadButton().hide();
        this.appendChild(this.imageUploader);
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

    layoutProperty(input: Input, property: Property): Q.Promise<void> {
        if (!ValueTypes.STRING.equals(property.getType()) && !ValueTypes.DATA.equals(property.getType())) {
            property.convertValueType(ValueTypes.STRING, ValueTypeConverter.convertTo);
        }

        this.input = input;

        this.imageUploader.onUploadStarted(() => this.imageUploader.getUploadButton().hide());

        if (property.hasNonNullValue()) {
            this.imageUploader.setFileName(MediaUploader.getFileNameFromProperty(property));
        }

        this.imageUploader.onFileUploaded((event: UploadedEvent<Content>) => {
            let content = event.getUploadItem().getModel();
            this.updateImageMimeType(content);
            let value = this.imageUploader.getMediaValue(content);
            this.imageUploader.setFileName(value.getString());

            this.imageUploader.setOriginalDimensions(
                this.readSizeValue(content, 'imageWidth'),
                this.readSizeValue(content, 'imageHeight'),
                this.readOrientation(content));

            this.saveToProperty(value);
            showFeedback(content.getDisplayName() + ' saved');
        });

        this.imageUploader.onUploadCompleted(() => this.imageUploader.resetBaseValues());

        this.imageUploader.onUploadReset(() => {
            this.imageUploader.setFileName('');
            this.saveToProperty(this.newInitialValue());
            this.imageUploader.getUploadButton().show();
        });

        this.imageUploader.onUploadFailed(() => {
            this.saveToProperty(this.newInitialValue());
            this.imageUploader.getUploadButton().show();
            this.imageUploader.setProgressVisible(false);
        });

        ImageErrorEvent.on((event: ImageErrorEvent) => {
            if (this.getContext().content.getContentId().equals(event.getContentId())) {
                this.imageUploader.getUploadButton().show();
                this.imageUploader.setProgressVisible(false);
            }
        });

        this.imageUploader.onEditModeChanged((edit: boolean, crop: Rect, zoom: Rect, focus: Point) => {
            this.validate(edit);

            if (!edit && crop) {
                this.saveEditDataToProperty(crop, zoom, focus);
            }
        });

        this.imageUploader.onCropAutoPositionedChanged(auto => {
            this.isCropAutoPositioned = auto;
            if (auto) {
                this.saveEditDataToProperty({x: 0, y: 0, x2: 1, y2: 1}, {x: 0, y: 0, x2: 1, y2: 1}, null);
            }
        });

        this.imageUploader.onFocusAutoPositionedChanged(auto => {
            this.isFocusAutoPositioned = auto;
            if (auto) {
                this.saveEditDataToProperty(null, null, {x: 0.5, y: 0.5});
            }
        });

        this.imageUploader.onOrientationChanged(orientation => {
            this.writeOrientation(this.getContext().content as Content, orientation);
        });

        return property.hasNonNullValue() ? this.updateProperty(property) : Q<void>(null);
    }

    private updateImageMimeType(content: Content): void {
        this.imageMimeType = content.getAttachments().getAttachment(0)?.getMimeType();
    }

    private handleImageEditorCreated(imageEditor: ImageEditor): void {
        if (this.imageMimeType === 'image/avif' || this.imageMimeType === 'image/webp') {
            imageEditor.setImageIsNonEditable();
        }
    }

    protected saveToProperty(value: Value) {
        this.ignorePropertyChange = true;
        let property = this.getProperty();
        switch (property.getType()) {
        case ValueTypes.DATA: {
            // update the attachment name, and reset the focal point data
            const set = property.getPropertySet();
            set.setProperty('attachment', 0, value);
            set.removeProperty('focalPoint', 0);
            // these values are set on save by the server, setting them here for the contents to be equal
            const focalSet = new PropertySet();
            focalSet.addDouble('x', 0.5);
            focalSet.addDouble('y', 0.5);
            set.setPropertySet('focalPoint', 0, focalSet);
            set.removeProperty('cropPosition', 0);
            set.removeProperty('zoomPosition', 0);
            break;
        }
        case ValueTypes.STRING:
            property.setValue(value);
            break;
        }
        this.validate();
        this.ignorePropertyChange = false;
    }

    updateProperty(_property: Property, unchangedOnly?: boolean): Q.Promise<void> {
        if ((!unchangedOnly || !this.imageUploader.isDirty()) && this.getContext().content.getContentId()) {

            return new GetContentByIdRequest(this.getContext().content.getContentId())
                .setRequestProject((this.context as ContentInputTypeViewContext).project)
                .sendAndParse().then((content: Content) => {

                    this.imageUploader.setOriginalDimensions(
                        this.readSizeValue(content, 'imageWidth'),
                        this.readSizeValue(content, 'imageHeight'),
                        this.readOrientation(content));

                    this.imageUploader.whenRendered(
                        () => {
                            this.imageUploader.setValue(content.getId(), false, false);
                            this.configEditorsProperties(content);
                        }
                    );


                }).catch((reason) => {
                    DefaultErrorHandler.handle(reason);
                });
        } else if (this.imageUploader.isDirty()) {
            this.imageUploader.forceChangedEvent();
        }
        return Q<void>(null);
    }

    reset() {
        this.imageUploader.resetBaseValues();
    }

    private saveEditDataToProperty(crop: Rect, zoom: Rect, focus: Point) {
        let container = this.getPropertyContainer(this.getProperty());

        this.saveCropToProperty(crop, zoom, container);
        this.saveFocusToProperty(focus, container);
    }

    private saveCropToProperty(crop: Rect, zoom: Rect, container?: PropertySet) {
        if (!container) {
            container = this.getPropertyContainer(this.getProperty());
        }
        if (container && crop && zoom) {
            if (this.isCropAutoPositioned && !this.hasOriginalCropAutoProperty()) {
                container.removeProperty('zoomPosition', 0);
                container.removeProperty('cropPosition', 0);
                return;
            }
            container.setDoubleByPath('zoomPosition.left', zoom.x);
            container.setDoubleByPath('zoomPosition.top', zoom.y);
            container.setDoubleByPath('zoomPosition.right', zoom.x2);
            container.setDoubleByPath('zoomPosition.bottom', zoom.y2);

            container.setDoubleByPath('cropPosition.left', crop.x);
            container.setDoubleByPath('cropPosition.top', crop.y);
            container.setDoubleByPath('cropPosition.right', crop.x2);
            container.setDoubleByPath('cropPosition.bottom', crop.y2);
            container.setDoubleByPath('cropPosition.zoom', zoom.x2 - zoom.x);
        } else {
            if (!zoom) {
                container.removeProperty('zoomPosition', 0);
            }
            if (!crop) {
                container.removeProperty('cropPosition', 0);
            }
        }
    }

    private hasOriginalCropAutoProperty(): boolean {
        const content: Content = this.getContext().content as Content;
        const property: Property = this.getMediaProperty(content, 'zoomPosition');

        return !!property;
    }

    private saveFocusToProperty(focus: Point, container?: PropertySet) {
        if (!container) {
            container = this.getPropertyContainer(this.getProperty());
        }
        if (container && focus) {
            if (this.isFocusAutoPositioned && container.getPropertySets('focalPoint').length === 0) {
                return;
            }
            container.setDoubleByPath('focalPoint.x', focus.x);
            container.setDoubleByPath('focalPoint.y', focus.y);
        }
    }

    private getPropertyContainer(property: Property): PropertySet {
        let container;
        switch (property.getType()) {
        case ValueTypes.DATA:
            container = property.getPropertySet();
            break;
        case ValueTypes.STRING: {
            // save in new format always no matter what was the format originally
            container = new PropertyTree().getRoot();
            container.setString('attachment', 0, property.getString());
            let propertyParent = property.getParent();
            let propertyName = property.getName();
            // remove old string property and set the new property set
            propertyParent.removeProperty(propertyName, 0);
            let newProperty = propertyParent.setPropertySet(propertyName, 0, container);
            // update local property reference
            this.registerProperty(newProperty);
            break;
        }
        }
        return container;
    }

    private getFocalPoint(content: Content): Point {
        let focalProperty = this.getMediaProperty(content, 'focalPoint');

        if (!focalProperty) {
            return null;
        }

        let focalSet = focalProperty.getPropertySet();
        let x = focalSet.getDouble('x');
        let y = focalSet.getDouble('y');

        if (!x || !y) {
            return null;
        }

        return {
            x: x,
            y: y
        };
    }

    private getRectFromProperty(content: Content, propertyName: string): Rect {
        let property = this.getMediaProperty(content, propertyName);

        if (!property) {
            return null;
        }

        let cropPositionSet = property.getPropertySet();
        let x = cropPositionSet.getDouble('left');
        let y = cropPositionSet.getDouble('top');
        let x2 = cropPositionSet.getDouble('right');
        let y2 = cropPositionSet.getDouble('bottom');

        return {x, y, x2, y2};
    }

    private writeOrientation(content: Content, orientation: number) {
        const container = this.getPropertyContainer(this.getProperty());

        if (container && orientation === this.readOriginalOrientation(content)) {
            container.removeProperty('orientation', 0);
        } else {
            container.setLongByPath('orientation', orientation);
        }
    }

    private readOrientation(content: Content): number {
        let property = this.getMediaProperty(content, 'orientation');
        if (!property) {
            return this.readOriginalOrientation(content);
        }
        return property && property.getLong() || 1;
    }

    private readOriginalOrientation(content: Content): number {
        const property = this.getMetaProperty(content, 'orientation');
        if (!property) {
            return 1;
        }
        return property && property.getLong() || 1;
    }

    private readSizeValue(content: Content, propertyName: string): number {
        let metaData = content.getProperty('metadata');
        if (metaData && ValueTypes.DATA.equals(metaData.getType())) {
            return parseInt(metaData.getPropertySet().getProperty(propertyName).getString(), 10);
        } else {
            metaData = this.getMetaProperty(content, propertyName);
            if (metaData) {
                return parseInt(metaData.getString(), 10);
            }
        }
        return 0;
    }

    private getMetaProperty(content: Content, propertyName: string): Property {
        const extraDatas = content.getAllExtraData();
        for (const extraData of extraDatas) {
            const metaProperty = extraData.getData().getProperty(propertyName);
            if (metaProperty) {
                return metaProperty;
            }
        }
    }

    private getMediaProperty(content: Content, propertyName: string) {
        let mediaProperty = content.getProperty('media');
        if (!mediaProperty || !ValueTypes.DATA.equals(mediaProperty.getType())) {
            return null;
        }
        return mediaProperty.getPropertySet().getProperty(propertyName);
    }

    private configEditorsProperties(content: Content) {
        let focalPoint = this.getFocalPoint(content);
        this.imageUploader.setFocalPoint(focalPoint);

        let cropPosition = this.getRectFromProperty(content, 'cropPosition');
        this.imageUploader.setCrop(cropPosition);

        let zoomPosition = this.getRectFromProperty(content, 'zoomPosition');
        this.imageUploader.setZoom(zoomPosition);

        const orientation = this.readOrientation(content);
        const originalOrientation = this.readOriginalOrientation(content);

        this.imageUploader.setOrientation(orientation, originalOrientation);
    }

    validate(silent: boolean = true) {
        const propertyValue = this.getProperty().getValue();
        const totalValid: number = (this.imageUploader.isFocalPointEditMode() || this.imageUploader.isCropEditMode() ||
                                    propertyValue.isNull()) ? 0 : 1;
        const recording = new InputValidationRecording(this.input.getOccurrences(), totalValid);

        if (!silent) {
            if (recording.validityChanged(this.previousValidationRecording)) {
                this.notifyValidityChanged(new InputValidityChangedEvent(recording));
            }
        }

        this.previousValidationRecording = recording;
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.imageUploader.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.imageUploader.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.imageUploader.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.imageUploader.unBlur(listener);
    }

}

InputTypeManager.register(new Class('ImageUploader', ImageUploader));
