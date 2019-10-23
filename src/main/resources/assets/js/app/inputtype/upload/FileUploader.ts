import * as Q from 'q';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {PropertyArray} from 'lib-admin-ui/data/PropertyArray';
import {Value} from 'lib-admin-ui/data/Value';
import {ValueType} from 'lib-admin-ui/data/ValueType';
import {ValueTypes} from 'lib-admin-ui/data/ValueTypes';
import {UploaderEl} from 'lib-admin-ui/ui/uploader/UploaderEl';
import {FileUploaderEl} from '../ui/upload/FileUploaderEl';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {BaseInputTypeManagingAdd} from 'lib-admin-ui/form/inputtype/support/BaseInputTypeManagingAdd';
import {Button} from 'lib-admin-ui/ui/button/Button';

export class FileUploader
    extends BaseInputTypeManagingAdd {

    protected config: ContentInputTypeViewContext;
    protected uploaderEl: FileUploaderEl<any>;
    protected uploaderWrapper: DivEl;
    protected uploadButton: DivEl;

    constructor(config: ContentInputTypeViewContext) {
        super('file-uploader');
        this.config = config;
    }

    getContext(): ContentInputTypeViewContext {
        return this.config;
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    newInitialValue(): Value {
        return null;
    }

    update(propertyArray: PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {

        let superPromise = super.update(propertyArray, unchangedOnly);
        this.uploaderEl.setContentId(this.getContext().content.getContentId().toString());

        return superPromise.then(() => {
            this.uploaderEl.resetValues(this.getValueFromPropertyArray(propertyArray));
            this.validate(false);
        });

    }

    reset() {
        this.uploaderEl.resetBaseValues();
    }

    protected setFileNameProperty(fileName: string) {

        let value = new Value(fileName, ValueTypes.STRING);

        if (!this.getPropertyArray().containsValue(value)) {
            this.ignorePropertyChange = true;
            this.getPropertyArray().add(value);
            this.ignorePropertyChange = false;
        }
    }

    protected getValueFromPropertyArray(propertyArray: PropertyArray): string {
        return this.getFileNamesFromProperty(propertyArray).join(FileUploaderEl.FILE_NAME_DELIMITER);
    }

    protected getFileNamesFromProperty(propertyArray: PropertyArray): string[] {
        return propertyArray.getProperties().map((property) => {
            if (property.hasNonNullValue()) {
                return property.getString();
            }
        });
    }

    protected createUploaderWrapper(): DivEl {
        const wrapper = new DivEl('uploader-wrapper');

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

    protected createUploader(): UploaderEl<any> {
        throw new Error('must be implemented in inheritors');
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
