import * as Q from 'q';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from '@enonic/lib-admin-ui/Class';
import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {UploadFailedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadFailedEvent';
import {UploadItem} from '@enonic/lib-admin-ui/ui/uploader/UploadItem';
import {UploadProgressEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadProgressEvent';
import {Content} from '../../content/Content';
import {ContentPath} from '../../content/ContentPath';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../event/EditContentEvent';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {GetMimeTypesByContentTypeNamesRequest} from '../../resource/GetMimeTypesByContentTypeNamesRequest';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {ContentSummaryOptionDataLoader} from '../ui/selector/ContentSummaryOptionDataLoader';
import {ImageOptionDataLoader, ImageOptionDataLoaderBuilder} from '../ui/selector/image/ImageOptionDataLoader';
import {ImageSelectorSelectedOptionsView} from '../ui/selector/image/ImageSelectorSelectedOptionsView';
import {ImageSelectorSelectedOptionView} from '../ui/selector/image/ImageSelectorSelectedOptionView';
import {ImageUploaderEl} from '../ui/selector/image/ImageUploaderEl';
import {MediaTreeSelectorItem} from '../ui/selector/media/MediaTreeSelectorItem';
import {ContentListBox} from './ContentListBox';
import {ContentSelectorDropdownOptions} from './ContentSelectorDropdown';
import {ImageContentListBox} from './ImageContentListBox';
import {ImageSelectorDropdown} from './ImageSelectorDropdown';
import {MediaSelector} from './MediaSelector';

export class ImageSelector
    extends MediaSelector<ImageSelectorSelectedOptionsView> {

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

    getSelectedOptionsView(): BaseSelectedOptionsView<MediaTreeSelectorItem> {
        return super.getSelectedOptionsView() as BaseSelectedOptionsView<MediaTreeSelectorItem>;
    }

    protected createSelectedOptionsView(): BaseSelectedOptionsView<MediaTreeSelectorItem> {
        let selectedOptionsView = new ImageSelectorSelectedOptionsView(this.context.content?.isReadOnly());

        selectedOptionsView.onEditSelectedOptions((options: SelectedOption<MediaTreeSelectorItem>[]) => {
            options.forEach((option: SelectedOption<MediaTreeSelectorItem>) => {
                const content = option.getOption().getDisplayValue().getContentSummary();
                const model = ContentSummaryAndCompareStatus.fromContentSummary(content);
                new EditContentEvent([model], this.context.project).fire();
            });
        });

        return selectedOptionsView;
    }

    createLoader(): ContentSummaryOptionDataLoader<MediaTreeSelectorItem> {
        return ImageOptionDataLoader.build(
            this.createOptionDataLoaderBuilder().setContent(this.context.content).setAllowedContentPaths(
                this.allowedContentPaths).setAppendLoadResults(false));
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
        }

        return Q(this.doInitUploader(new ImageUploaderEl(config)));
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
                this.getSelectedOptionsView().getById(item.getId());

            if (!!selectedOption) {
                this.getSelectedOptionsView().removeOption(selectedOption.getOption());
            }
        });
    }

    protected createSelectorItem(content: ContentSummaryAndCompareStatus): MediaTreeSelectorItem {
        return MediaTreeSelectorItem.create().setContent(content).build();
    }

    protected createContentListBox(loader: ContentSummaryOptionDataLoader<MediaTreeSelectorItem>): ImageContentListBox {
        return new ImageContentListBox({loader: loader});
    }

    protected doCreateSelectorDropdown(listBox: ContentListBox<ContentTreeSelectorItem>,
                                       dropdownOptions: ContentSelectorDropdownOptions): ImageSelectorDropdown {
        return new ImageSelectorDropdown(listBox, dropdownOptions);
    }

    protected getDropdownClassName(): string {
        return 'gallery-mode';
    }

    protected handleSelectedOptionDeleted(selectedOption: SelectedOption<ContentTreeSelectorItem>): void {
        const option = selectedOption.getOption();
        const contentId = option.getDisplayValue().getContentId();
        const newValue = MediaTreeSelectorItem.create().setContent(ContentSummaryAndCompareStatus.fromId(contentId)).setAvailabilityStatus(
            'NOT_FOUND').build();
        option.setDisplayValue(newValue);
        selectedOption.getOptionView().setOption(option);
    }
}

InputTypeManager.register(new Class('ImageSelector', ImageSelector));
