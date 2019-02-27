import PropertyArray = api.data.PropertyArray;
import ContentTypeName = api.schema.content.ContentTypeName;
import ComboBox = api.ui.selector.combobox.ComboBox;
import SelectedOption = api.ui.selector.combobox.SelectedOption;
import UploadedEvent = api.ui.uploader.UploadedEvent;
import UploadFailedEvent = api.ui.uploader.UploadFailedEvent;
import {ContentSelector} from './ContentSelector';
import {MediaTreeSelectorItem} from '../ui/selector/media/MediaTreeSelectorItem';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {MediaUploaderEl, MediaUploaderElConfig, MediaUploaderElOperation} from '../ui/upload/MediaUploaderEl';
import {ContentSummaryOptionDataLoader} from '../ui/selector/ContentSummaryOptionDataLoader';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {Content} from '../../content/Content';
import {GetMimeTypesByContentTypeNamesRequest} from '../../resource/GetMimeTypesByContentTypeNamesRequest';

export class MediaSelector
    extends ContentSelector {

    protected uploader: MediaUploaderEl;

    constructor(config?: ContentInputTypeViewContext) {
        super(config);
        this.addClass('media-selector');
    }

    layout(input: api.form.Input, propertyArray: PropertyArray): wemQ.Promise<void> {

        return super.layout(input, propertyArray).then(() => {
            if (this.config.content) {
                return this.createUploader().then((mediaUploader) => {
                    this.comboBoxWrapper.appendChild(this.uploader = mediaUploader);

                    if (!this.contentComboBox.getComboBox().isVisible()) {
                        this.uploader.hide();
                    }
                });
            }
        });
    }

    protected getDefaultContentTypes(): ContentTypeName[] {
        return ContentTypeName.getMediaTypes();
    }

    protected readConfig(inputConfig: { [element: string]: { [name: string]: string }[]; }): void {
        super.readConfig(inputConfig);

        const allowedContentTypes: string[] = this.getDefaultContentTypes().map(type => type.toString());
        let allowedMediaTypes: string[] = this.allowedContentTypes.filter(value => allowedContentTypes.indexOf(value) >= 0);

        if (allowedMediaTypes.length === 0) {
            allowedMediaTypes = allowedContentTypes;
        }

        this.allowedContentTypes = allowedMediaTypes;
    }

    protected getDefaultAllowPath(): string {
        return '';
    }

    protected createOptionDataLoader() {
        return ContentSummaryOptionDataLoader.create()
            .setAllowedContentPaths(this.allowedContentPaths)
            .setContentTypeNames(this.allowedContentTypes)
            .setRelationshipType(this.relationshipType)
            .setContent(this.config.content)
            .setLoadStatus(this.showStatus)
            .build();

    }

    protected createUploader(): wemQ.Promise<MediaUploaderEl> {
        let multiSelection = (this.getInput().getOccurrences().getMaximum() !== 1);

        const config: MediaUploaderElConfig = {
            params: {
                parent: this.config.content.getContentId().toString()
            },
            operation: MediaUploaderElOperation.create,
            name: 'media-selector-upload-el',
            showCancel: false,
            showResult: false,
            maximumOccurrences: this.getRemainingOccurrences(),
            allowMultiSelection: multiSelection
        };

        if (this.allowedContentTypes.length > 0) {
            return new GetMimeTypesByContentTypeNamesRequest(
                this.allowedContentTypes.map(name => new ContentTypeName(name)))
                .sendAndParse()
                .then((mimeTypes: string[]) => {
                    config.allowMimeTypes = mimeTypes;
                    return this.doInitUploader(new MediaUploaderEl(config));
                });
        } else {
            return wemQ(this.doInitUploader(new MediaUploaderEl(config)));
        }
    }

    protected doInitUploader(uploader: MediaUploaderEl): MediaUploaderEl {

        uploader.onUploadProgress(() => {
            uploader.setMaximumOccurrences(this.getRemainingOccurrences());
        });

        uploader.onFileUploaded((event: UploadedEvent<Content>) => {
            const createdContent = event.getUploadItem().getModel();

            const option = <api.ui.selector.Option<MediaTreeSelectorItem>>{
                value: createdContent.getContentId().toString(),
                displayValue: new MediaTreeSelectorItem(createdContent)
            };
            this.contentComboBox.selectOption(option);
            const selectedOption = this.getSelectedOptionsView().getById(createdContent.getContentId().toString());

            this.selectedOptionHandler(selectedOption);

            this.setContentIdProperty(createdContent.getContentId());
            this.validate(false);

            uploader.setMaximumOccurrences(this.getRemainingOccurrences());
        });

        this.initFailedListener(uploader);

        uploader.onClicked(() => {
            uploader.setMaximumOccurrences(this.getRemainingOccurrences());
        });

        this.onDragEnter((event: DragEvent) => {
            event.stopPropagation();
            uploader.giveFocus();
            uploader.setDefaultDropzoneVisible(true, true);
        });

        uploader.onDropzoneDragLeave(() => {
            uploader.giveBlur();
            uploader.setDefaultDropzoneVisible(false);
        });

        uploader.onDropzoneDrop(() => {
            uploader.setMaximumOccurrences(this.getRemainingOccurrences());
            uploader.setDefaultDropzoneVisible(false);
        });

        const comboBox: ComboBox<ContentTreeSelectorItem> = this.contentComboBox.getComboBox();

        comboBox.onHidden(() => {
            // hidden on max occurrences reached
            if (uploader) {
                uploader.hide();
            }
        });
        comboBox.onShown(() => {
            // shown on occurrences between min and max
            if (uploader) {
                uploader.show();
            }
        });

        return uploader;
    }

    protected selectedOptionHandler(_selectedOption: SelectedOption<ContentTreeSelectorItem>) {
        // empty
    }

    protected initFailedListener(uploader: MediaUploaderEl) {
        uploader.onUploadFailed((event: UploadFailedEvent<Content>) => {
            let item = event.getUploadItem();

            let selectedOption = this.getSelectedOptionsView().getById(item.getId());
            if (!!selectedOption) {
                this.getSelectedOptionsView().removeOption(selectedOption.getOption());
            }

            uploader.setMaximumOccurrences(this.getRemainingOccurrences());
        });
    }

    protected getRemainingOccurrences(): number {
        let inputMaximum = this.getInput().getOccurrences().getMaximum();
        let countSelected = this.getSelectedOptionsView().count();
        let rest = -1;
        if (inputMaximum === 0) {
            rest = 0;
        } else {
            rest = inputMaximum - countSelected;
            rest = (rest === 0) ? -1 : rest;
        }

        return rest;
    }
}

api.form.inputtype.InputTypeManager.register(new api.Class('MediaSelector', MediaSelector));
