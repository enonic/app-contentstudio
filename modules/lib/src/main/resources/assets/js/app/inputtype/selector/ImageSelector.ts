import * as Q from 'q';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {Input} from 'lib-admin-ui/form/Input';
import {InputTypeManager} from 'lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from 'lib-admin-ui/Class';
import {PropertyArray} from 'lib-admin-ui/data/PropertyArray';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ComboBox} from 'lib-admin-ui/ui/selector/combobox/ComboBox';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionEvent} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {UploadFailedEvent} from 'lib-admin-ui/ui/uploader/UploadFailedEvent';
import {UploadProgressEvent} from 'lib-admin-ui/ui/uploader/UploadProgressEvent';
import {MediaSelector} from './MediaSelector';
import {ImageContentComboBox, ImageContentComboBoxBuilder} from '../ui/selector/image/ImageContentComboBox';
import {ImageSelectorSelectedOptionsView} from '../ui/selector/image/ImageSelectorSelectedOptionsView';
import {ImageUploaderEl} from '../ui/selector/image/ImageUploaderEl';
import {ImageSelectorSelectedOptionView} from '../ui/selector/image/ImageSelectorSelectedOptionView';
import {MediaTreeSelectorItem} from '../ui/selector/media/MediaTreeSelectorItem';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {Content} from '../../content/Content';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {InputValidationRecording} from 'lib-admin-ui/form/inputtype/InputValidationRecording';
import {GetMimeTypesByContentTypeNamesRequest} from '../../resource/GetMimeTypesByContentTypeNamesRequest';
import {ImageOptionDataLoader} from '../ui/selector/image/ImageOptionDataLoader';
import {ContentSummaryOptionDataLoader} from '../ui/selector/ContentSummaryOptionDataLoader';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';

export class ImageSelector
    extends MediaSelector {

    private editContentRequestListeners: { (content: ContentSummary): void }[] = [];

    private isPendingPreload: boolean = true;

    constructor(config: ContentInputTypeViewContext) {
        super(config);

        this.addClass('image-selector');

        ResponsiveManager.onAvailableSizeChanged(this, () => this.availableSizeChanged());

        // Don't forget to clean up the modal dialog on remove
        this.onRemoved(() => ResponsiveManager.unAvailableSizeChanged(this));
    }

    public getContentComboBox(): ImageContentComboBox {
        return <ImageContentComboBox>this.contentComboBox;
    }

    protected getContentPath(raw: MediaTreeSelectorItem): ContentPath {
        return raw.getContentSummary().getPath();
    }

    getSelectedOptionsView(): ImageSelectorSelectedOptionsView {
        return <ImageSelectorSelectedOptionsView>super.getSelectedOptionsView();
    }

    private createSelectedOptionsView(): ImageSelectorSelectedOptionsView {
        let selectedOptionsView = new ImageSelectorSelectedOptionsView();

        selectedOptionsView.onEditSelectedOptions((options: SelectedOption<MediaTreeSelectorItem>[]) => {
            options.forEach((option: SelectedOption<MediaTreeSelectorItem>) => {
                this.notifyEditContentRequested(option.getOption().getDisplayValue().getContentSummary());
            });
        });

        selectedOptionsView.onRemoveSelectedOptions((options: SelectedOption<MediaTreeSelectorItem>[]) => {
            options.forEach((option: SelectedOption<MediaTreeSelectorItem>) => {
                const item: MediaTreeSelectorItem = option.getOption().getDisplayValue();

                if (item.isEmptyContent()) {
                    selectedOptionsView.removeOption(option.getOption());
                    this.handleDeselected(option.getIndex());
                } else {
                    this.contentComboBox.deselect(item);
                }

            });
            this.validate(false);
        });

        return selectedOptionsView;
    }

    protected createOptionDataLoader(): ContentSummaryOptionDataLoader<ContentTreeSelectorItem> {
        return ImageOptionDataLoader.build(this.createOptionDataLoaderBuilder());
    }

    protected doCreateContentComboBoxBuilder(): ImageContentComboBoxBuilder {
        return ImageContentComboBox.create();
    }

    protected createContentComboBoxBuilder(input: Input, propertyArray: PropertyArray): ImageContentComboBoxBuilder {
        return <ImageContentComboBoxBuilder>super.createContentComboBoxBuilder(input, propertyArray)
            .setSelectedOptionsView(this.createSelectedOptionsView())
            .setDisplayMissingSelectedOptions(true)
            .setRemoveMissingSelectedOptions(false);
    }

    protected initEvents(contentComboBox: ImageContentComboBox) {

        const comboBox: ComboBox<MediaTreeSelectorItem> = contentComboBox.getComboBox();
        const loader = <ImageOptionDataLoader>contentComboBox.getLoader();

        const onPreloadedData = (data: MediaTreeSelectorItem[]) => {
            data.forEach((item: MediaTreeSelectorItem) => {
                this.contentComboBox.select(item);
            });
            this.isPendingPreload = false;
            if (data.length > 0) {
                this.validate(false);
            }
            loader.unPreloadedData(onPreloadedData);
        };

        loader.onPreloadedData(onPreloadedData);

        comboBox.onOptionDeselected((event: SelectedOptionEvent<MediaTreeSelectorItem>) => {
            // property not found.
            const option = event.getSelectedOption();
            if (option.getOption().getDisplayValue().getContentSummary()) {
                this.handleDeselected(option.getIndex());
            }
            this.validate(false);
        });

        comboBox.onOptionSelected((event: SelectedOptionEvent<MediaTreeSelectorItem>) => {
            this.fireFocusSwitchEvent(event);

            if (!this.isLayoutInProgress()) {
                let contentId = event.getSelectedOption().getOption().getDisplayValue().getContentId();
                if (!contentId) {
                    return;
                }

                this.setContentIdProperty(contentId);
            }
            this.validate(false);
        });

        comboBox.onOptionMoved((moved: SelectedOption<MediaTreeSelectorItem>, fromIndex: number) => {
            this.handleMoved(moved, fromIndex);
            this.validate(false);
        });
    }

    protected createContentComboBox(input: Input, propertyArray: PropertyArray): ImageContentComboBox {

        const contentComboBox: ImageContentComboBox = <ImageContentComboBox>super.createContentComboBox(input, propertyArray);

        this.isPendingPreload = !StringHelper.isBlank(this.getValueFromPropertyArray(propertyArray));

        return contentComboBox;
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        return super.layout(input, propertyArray).then(() => {
            this.setLayoutInProgress(false);
        });
    }

    protected doLayout(_propertyArray: PropertyArray): Q.Promise<void> {
        return Q(null);
    }

    protected createUploader(): Q.Promise<ImageUploaderEl> {
        const config = this.createUploaderConfig();

        if (this.allowedContentTypes.length > 0) {
            return new GetMimeTypesByContentTypeNamesRequest(
                this.allowedContentTypes.map(name => new ContentTypeName(name)))
                .sendAndParse()
                .then((mimeTypes: string[]) => {
                    config.allowMimeTypes = mimeTypes;
                    return this.doInitUploader(new ImageUploaderEl(config));
                });
        } else {
            return Q(this.doInitUploader(new ImageUploaderEl(config)));
        }
    }

    protected doInitUploader(uploader: ImageUploaderEl): ImageUploaderEl {

        super.doInitUploader(uploader);

        uploader.onUploadProgress((event: UploadProgressEvent<Content>) => {
            let item = event.getUploadItem();

            let selectedOption = this.getSelectedOptionsView().getById(item.getId());
            if (!!selectedOption) {
                (<ImageSelectorSelectedOptionView> selectedOption.getOptionView()).setProgress(item.getProgress());
            }
        });

        return uploader;
    }

    protected getDefaultContentTypes(): ContentTypeName[] {
        return [ContentTypeName.IMAGE, ContentTypeName.MEDIA_VECTOR];
    }

    protected selectedOptionHandler(selectedOption: SelectedOption<MediaTreeSelectorItem>) {
        (<ImageSelectorSelectedOptionView>selectedOption.getOptionView()).getCheckbox().setChecked(true);
    }

    protected initFailedListener(uploader: ImageUploaderEl) {
        uploader.onUploadFailed((event: UploadFailedEvent<Content>) => {
            let item = event.getUploadItem();

            let selectedOption = this.getSelectedOptionsView().getById(item.getId());
            if (!!selectedOption) {
                this.getSelectedOptionsView().removeSelectedOptions([selectedOption]);
            }
        });
    }

    validate(silent: boolean = true) {
        if (!this.isPendingPreload) {
            super.validate(silent);
        }
    }

    onEditContentRequest(listener: (content: ContentSummary) => void) {
        this.editContentRequestListeners.push(listener);
    }

    unEditContentRequest(listener: (content: ContentSummary) => void) {
        this.editContentRequestListeners = this.editContentRequestListeners
            .filter(function (curr: (content: ContentSummary) => void) {
                return curr !== listener;
            });
    }

    private notifyEditContentRequested(content: ContentSummary) {
        this.editContentRequestListeners.forEach((listener) => {
            listener(content);
        });
    }
}

InputTypeManager.register(new Class('ImageSelector', ImageSelector));
