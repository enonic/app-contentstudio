import * as Q from 'q';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from '@enonic/lib-admin-ui/Class';
import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {UploadFailedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadFailedEvent';
import {UploadProgressEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadProgressEvent';
import {MediaSelector} from './MediaSelector';
import {ImageSelectorSelectedOptionsView} from '../ui/selector/image/ImageSelectorSelectedOptionsView';
import {ImageUploaderEl} from '../ui/selector/image/ImageUploaderEl';
import {ImageSelectorSelectedOptionView} from '../ui/selector/image/ImageSelectorSelectedOptionView';
import {MediaTreeSelectorItem} from '../ui/selector/media/MediaTreeSelectorItem';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {Content} from '../../content/Content';
import {GetMimeTypesByContentTypeNamesRequest} from '../../resource/GetMimeTypesByContentTypeNamesRequest';
import {ImageOptionDataLoader, ImageOptionDataLoaderBuilder} from '../ui/selector/image/ImageOptionDataLoader';
import {ContentSummaryOptionDataLoader} from '../ui/selector/ContentSummaryOptionDataLoader';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../event/EditContentEvent';
import {ContentPath} from '../../content/ContentPath';
import {UploadItem} from '@enonic/lib-admin-ui/ui/uploader/UploadItem';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentId} from '../../content/ContentId';
import {ImageContentListBox} from './ImageContentListBox';
import {ImageSelectorDropdown} from './ImageSelectorDropdown';
import {ContentSelectorDropdownOptions} from './ContentSelectorDropdown';
import {ContentListBox} from './ContentListBox';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';

export class ImageSelector
    extends MediaSelector {

    constructor(context: ContentInputTypeViewContext) {
        super(context);

        this.addClass('image-selector');

        ResponsiveManager.onAvailableSizeChanged(this, () => this.availableSizeChanged());

        // Don't forget to clean up the modal dialog on remove
        this.onRemoved(() => ResponsiveManager.unAvailableSizeChanged(this));
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
                    this.contentSelectorDropdown.deselect(item);
                }

            });
            this.handleValueChanged(false);
        });

        return selectedOptionsView;
    }

    createLoader(): ContentSummaryOptionDataLoader<MediaTreeSelectorItem> {
        return ImageOptionDataLoader.build(this.createOptionDataLoaderBuilder());
    }

    protected createOptionDataLoaderBuilder(): ImageOptionDataLoaderBuilder {
        return new ImageOptionDataLoaderBuilder();
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

    protected createContentListBox(loader: ContentSummaryOptionDataLoader<MediaTreeSelectorItem>): ImageContentListBox {
        return new ImageContentListBox({loader: loader});
    }

    protected doCreateSelectorDropdown(listBox: ContentListBox<ContentTreeSelectorItem>,
                                       dropdownOptions: ContentSelectorDropdownOptions): ImageSelectorDropdown {
        return new ImageSelectorDropdown(listBox, dropdownOptions);
    }

    protected getDropdownClassName(): string {
        return 'image-selector-dropdown';
    }
}

InputTypeManager.register(new Class('ImageSelector', ImageSelector));
