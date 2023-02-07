import * as Q from 'q';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {Class} from '@enonic/lib-admin-ui/Class';
import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ComboBox} from '@enonic/lib-admin-ui/ui/selector/combobox/ComboBox';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {UploadedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadedEvent';
import {UploadFailedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadFailedEvent';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {ContentSelector} from './ContentSelector';
import {MediaTreeSelectorItem} from '../ui/selector/media/MediaTreeSelectorItem';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {MediaUploaderEl, MediaUploaderElConfig, MediaUploaderElOperation} from '../ui/upload/MediaUploaderEl';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {GetMimeTypesByContentTypeNamesRequest} from '../../resource/GetMimeTypesByContentTypeNamesRequest';
import {Content} from '../../content/Content';
import {UploadItem} from '@enonic/lib-admin-ui/ui/uploader/UploadItem';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentPath} from '../../content/ContentPath';

export class MediaSelector
    extends ContentSelector {

    protected uploader: MediaUploaderEl;

    constructor(context: ContentInputTypeViewContext) {
        super(context);
        this.addClass('media-selector');
    }

    protected addExtraElementsOnLayout(input: Input, propertyArray: PropertyArray): Q.Promise<void> {
        return this.createUploader().then((mediaUploader: MediaUploaderEl) => {
            this.comboBoxWrapper.appendChild(this.uploader = mediaUploader);

            if (!this.contentComboBox.getComboBox().isVisible()) {
                this.uploader.hide();
            }
        });
    }

    protected getDefaultContentTypes(): ContentTypeName[] {
        return ContentTypeName.getMediaTypes();
    }

    protected readInputConfig(): void {
        super.readInputConfig();

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

    protected createUploader(): Q.Promise<MediaUploaderEl> {
        const config: MediaUploaderElConfig = this.createUploaderConfig();

        if (this.allowedContentTypes.length > 0) {
            return new GetMimeTypesByContentTypeNamesRequest(
                this.allowedContentTypes.map(name => new ContentTypeName(name)))
                .sendAndParse()
                .then((mimeTypes: string[]) => {
                    config.allowMimeTypes = mimeTypes;
                    return this.doInitUploader(new MediaUploaderEl(config));
                });
        } else {
            return Q(this.doInitUploader(new MediaUploaderEl(config)));
        }
    }

    protected createUploaderConfig(): MediaUploaderElConfig {
        const isMultiSelection: boolean = (this.getInput().getOccurrences().getMaximum() !== 1);

        return {
            params: {
                parent: this.context.content?.getContentId().toString() || ContentPath.getRoot().toString()
            },
            operation: MediaUploaderElOperation.create,
            name: 'media-selector-upload-el',
            showCancel: false,
            showResult: false,
            getTotalAllowedToUpload: this.getRemainingOccurrences.bind(this),
            allowMultiSelection: isMultiSelection
        };
    }

    protected doInitUploader(uploader: MediaUploaderEl): MediaUploaderEl {
        uploader.onFileUploaded((event: UploadedEvent<Content>) => {
            const createdContent = event.getUploadItem().getModel();

            const option = Option.create<MediaTreeSelectorItem>()
                    .setValue(createdContent.getContentId().toString())
                    .setDisplayValue(this.createSelectorItem(createdContent))
                    .build();

            this.contentComboBox.selectOption(option);
            const selectedOption = this.getSelectedOptionsView().getById(createdContent.getContentId().toString());

            this.selectedOptionHandler(selectedOption);

            this.setContentIdProperty(createdContent.getContentId());
            this.validate(false);
        });

        this.initFailedListener(uploader);

        this.onDragEnter((event: DragEvent) => {
            event.stopPropagation();
            uploader.giveFocus();
            uploader.setDefaultDropzoneVisible();
        });

        uploader.onDropzoneDragLeave(() => {
            uploader.giveBlur();
            uploader.setDefaultDropzoneVisible(false);
        });

        uploader.onDropzoneDrop(() => {
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

    protected createSelectorItem(content: ContentSummary): MediaTreeSelectorItem {
        return new MediaTreeSelectorItem(content);
    }

    protected selectedOptionHandler(_selectedOption: SelectedOption<ContentTreeSelectorItem>) {
        // empty
    }

    protected initFailedListener(uploader: MediaUploaderEl) {
        uploader.onUploadFailed((event: UploadFailedEvent<Content>) => {
            const item: UploadItem<Content> = event.getUploadItem();

            const selectedOption: SelectedOption<ContentTreeSelectorItem> = this.getSelectedOptionsView().getById(item.getId());
            if (!!selectedOption) {
                this.getSelectedOptionsView().removeOption(selectedOption.getOption());
            }
        });
    }

    protected getRemainingOccurrences(): number {
        const inputMaximum: number = this.getInput().getOccurrences().getMaximum();

        if (inputMaximum === 0) {
            return Number.MAX_SAFE_INTEGER;
        }

        const countSelected: number = this.getSelectedOptionsView().count();
        const rest: number = inputMaximum - countSelected;

        if (rest === 0) {
            return -1;
        }

        return rest;
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);
        this.uploader.setEnabled(enable);
    }
}

InputTypeManager.register(new Class('MediaSelector', MediaSelector));
