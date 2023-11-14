import * as Q from 'q';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from '@enonic/lib-admin-ui/Class';
import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ComboBox} from '@enonic/lib-admin-ui/ui/selector/combobox/ComboBox';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {SelectedOptionEvent} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {UploadFailedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadFailedEvent';
import {UploadProgressEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadProgressEvent';
import {MediaSelector} from './MediaSelector';
import {ImageContentComboBox, ImageContentComboBoxBuilder} from '../ui/selector/image/ImageContentComboBox';
import {ImageSelectorSelectedOptionsView} from '../ui/selector/image/ImageSelectorSelectedOptionsView';
import {ImageUploaderEl} from '../ui/selector/image/ImageUploaderEl';
import {ImageSelectorSelectedOptionView} from '../ui/selector/image/ImageSelectorSelectedOptionView';
import {MediaTreeSelectorItem} from '../ui/selector/media/MediaTreeSelectorItem';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {Content} from '../../content/Content';
import {GetMimeTypesByContentTypeNamesRequest} from '../../resource/GetMimeTypesByContentTypeNamesRequest';
import {ImageOptionDataLoader} from '../ui/selector/image/ImageOptionDataLoader';
import {ContentSummaryOptionDataLoader} from '../ui/selector/ContentSummaryOptionDataLoader';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../event/EditContentEvent';
import {ContentPath} from '../../content/ContentPath';
import {UploadItem} from '@enonic/lib-admin-ui/ui/uploader/UploadItem';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentId} from '../../content/ContentId';

export class ImageSelector
    extends MediaSelector {

    constructor(context: ContentInputTypeViewContext) {
        super(context);

        this.addClass('image-selector');

        ResponsiveManager.onAvailableSizeChanged(this, () => this.availableSizeChanged());

        // Don't forget to clean up the modal dialog on remove
        this.onRemoved(() => ResponsiveManager.unAvailableSizeChanged(this));
    }

    public getContentComboBox(): ImageContentComboBox {
        return this.contentComboBox as ImageContentComboBox;
    }

    protected getContentPath(raw: MediaTreeSelectorItem): ContentPath {
        return raw.getContentSummary()?.getPath();
    }

    getSelectedOptionsView(): ImageSelectorSelectedOptionsView {
        return super.getSelectedOptionsView() as ImageSelectorSelectedOptionsView;
    }

    protected createSelectedOptionsView(): ImageSelectorSelectedOptionsView {
        let selectedOptionsView = new ImageSelectorSelectedOptionsView();

        selectedOptionsView.onEditSelectedOptions((options: SelectedOption<MediaTreeSelectorItem>[]) => {
            options.forEach((option: SelectedOption<MediaTreeSelectorItem>) => {
                const content = option.getOption().getDisplayValue().getContentSummary();
                const model = ContentSummaryAndCompareStatus.fromContentSummary(content);
                new EditContentEvent([model], this.context.project).fire();
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
            this.handleValueChanged(false);
        });

        return selectedOptionsView;
    }

    protected createOptionDataLoader(): ContentSummaryOptionDataLoader<ContentTreeSelectorItem> {
        return ImageOptionDataLoader.build(this.createOptionDataLoaderBuilder());
    }

    protected doCreateContentComboBoxBuilder(): ImageContentComboBoxBuilder {
        return ImageContentComboBox.create().setProject(this.context.project);
    }

    protected createContentComboBoxBuilder(input: Input, propertyArray: PropertyArray): ImageContentComboBoxBuilder {
        return super.createContentComboBoxBuilder(input, propertyArray)
            .setSelectedOptionsView(this.createSelectedOptionsView())
            .setDisplayMissingSelectedOptions(true)
            .setRemoveMissingSelectedOptions(false) as ImageContentComboBoxBuilder;
    }

    protected initEvents(contentComboBox: ImageContentComboBox) {
        const comboBox: ComboBox<MediaTreeSelectorItem> = contentComboBox.getComboBox();

        comboBox.onOptionDeselected((event: SelectedOptionEvent<MediaTreeSelectorItem>) => {
            // property not found.
            const option = event.getSelectedOption();
            if (option.getOption().getDisplayValue().getContentSummary()) {
                this.handleDeselected(option.getIndex());
            }
            this.handleValueChanged(false);
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
            this.handleValueChanged(false);
        });

        comboBox.onOptionMoved((moved: SelectedOption<MediaTreeSelectorItem>, fromIndex: number) => {
            this.handleMoved(moved, fromIndex);
            this.handleValueChanged(false);
        });
    }

    layout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        return super.layout(input, propertyArray).then(() => {
            this.setLayoutInProgress(false);
        });
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
                (selectedOption.getOptionView() as ImageSelectorSelectedOptionView).setProgress(item.getProgress());
            }
        });

        return uploader;
    }

    protected getDefaultContentTypes(): ContentTypeName[] {
        return [ContentTypeName.IMAGE, ContentTypeName.MEDIA_VECTOR];
    }

    protected selectedOptionHandler(selectedOption: SelectedOption<MediaTreeSelectorItem>) {
        (selectedOption.getOptionView() as ImageSelectorSelectedOptionView).getCheckbox().setChecked(true);
    }

    protected initFailedListener(uploader: ImageUploaderEl) {
        uploader.onUploadFailed((event: UploadFailedEvent<Content>) => {
            const item: UploadItem<Content> = event.getUploadItem();

            const selectedOption: SelectedOption<MediaTreeSelectorItem> =
                this.getSelectedOptionsView().getById(item.getId()) as SelectedOption<MediaTreeSelectorItem>;

            if (!!selectedOption) {
                this.getSelectedOptionsView().removeSelectedOptions([selectedOption]);
            }
        });
    }

    protected createSelectorItem(content: ContentSummary | ContentSummaryAndCompareStatus, selectable: boolean = true,
                                 expandable: boolean = true): MediaTreeSelectorItem {
        if (content instanceof ContentSummaryAndCompareStatus) {
            return new MediaTreeSelectorItem(content.getContentSummary(), selectable, expandable);
        }

        return new MediaTreeSelectorItem(content, selectable, expandable);
    }

    protected createMissingContentItem(id: ContentId): MediaTreeSelectorItem {
        return new MediaTreeSelectorItem().setMissingItemId(id.toString());
    }

    protected updateSelectedOptionIsEditable(selectedOption: SelectedOption<ContentTreeSelectorItem>) {
        // different behavior for image selector
    }

    protected handleOptionUpdated(optionsUpdated: SelectedOption<ContentTreeSelectorItem>[]) {
        super.handleOptionUpdated(optionsUpdated);

        this.getSelectedOptionsView().updateSelectionToolbarLayout();
    }
}

InputTypeManager.register(new Class('ImageSelector', ImageSelector));
