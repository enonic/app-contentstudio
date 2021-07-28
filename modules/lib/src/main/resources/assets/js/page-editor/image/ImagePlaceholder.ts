import {i18n} from 'lib-admin-ui/util/Messages';
import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ItemViewPlaceholder} from '../ItemViewPlaceholder';
import {ImageComponentView} from './ImageComponentView';
import {ImageContentComboBox} from '../../app/inputtype/ui/selector/image/ImageContentComboBox';
import {ImageUploaderEl} from '../../app/inputtype/ui/selector/image/ImageUploaderEl';
import {MediaTreeSelectorItem} from '../../app/inputtype/ui/selector/media/MediaTreeSelectorItem';
import {MediaUploaderElOperation} from '../../app/inputtype/ui/upload/MediaUploaderEl';
import {Content} from '../../app/content/Content';
import {ImageComponent} from '../../app/page/region/ImageComponent';
import {GetContentByIdRequest} from '../../app/resource/GetContentByIdRequest';
import {SelectedOptionEvent} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {UploadedEvent} from 'lib-admin-ui/ui/uploader/UploadedEvent';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentSummary} from '../../app/content/ContentSummary';

export class ImagePlaceholder
    extends ItemViewPlaceholder {

    private imageComponentView: ImageComponentView;

    private comboBox: ImageContentComboBox;

    private comboboxWrapper: DivEl;

    private imageUploader: ImageUploaderEl;

    constructor(imageView: ImageComponentView) {
        super();
        this.addClassEx('image-placeholder').addClass(StyleHelper.getCommonIconCls('image'));
        this.imageComponentView = imageView;

        this.initImageCombobox(imageView);
        this.initImageUploader(imageView);
        this.initImageComboboxWrapper();
    }

    private initImageCombobox(imageView: ImageComponentView) {
        this.comboBox = ImageContentComboBox.create()
            .setMaximumOccurrences(1)
            .setContent(imageView.getLiveEditModel().getContent())
            .setTreegridDropdownEnabled(false)
            .setMinWidth(270)
            .build();

        this.comboBox.getComboBox().getInput().setPlaceholder(i18n('field.image.option.placeholder'));
        this.comboBox.onOptionSelected((event: SelectedOptionEvent<MediaTreeSelectorItem>) => {
            const component: ImageComponent = this.imageComponentView.getComponent();
            const imageContentSummary: ContentSummary =
                (event.getSelectedOption().getOption().getDisplayValue()).getContentSummary();

            new GetContentByIdRequest(imageContentSummary.getContentId()).sendAndParse().then((imageContent: Content) => {
                component.setImage(imageContent);
            }).catch(DefaultErrorHandler.handle);

            this.imageComponentView.showLoadingSpinner();
        });
    }

    private initImageUploader(imageView: ImageComponentView) {
        this.imageUploader = new ImageUploaderEl({
            params: {
                parent: imageView.getLiveEditModel().getContent().getContentId().toString()
            },
            operation: MediaUploaderElOperation.create,
            name: 'image-selector-placeholder-upload',
            showCancel: false,
            showResult: false,
            allowMultiSelection: false,
            hideDefaultDropZone: true,
            deferred: true
        });

        this.imageUploader.getUploadButton().onClicked(() => this.comboboxWrapper.show());

        this.imageUploader.onFileUploaded((event: UploadedEvent<Content>) => {
            const createdImage: Content = event.getUploadItem().getModel();
            const component: ImageComponent = this.imageComponentView.getComponent();

            component.setImage(createdImage);
        });

        this.imageUploader.addDropzone(this.comboBox.getId());
    }

    private initImageComboboxWrapper() {
        this.comboboxWrapper = new DivEl('rich-combobox-wrapper');
        this.comboboxWrapper.appendChild(this.comboBox);
        this.comboboxWrapper.appendChild(<any>this.imageUploader);
        this.appendChild(this.comboboxWrapper);
    }

    select() {
        this.comboboxWrapper.show();
        this.comboBox.giveFocus();
    }

    deselect() {
        this.comboboxWrapper.hide();
    }
}
