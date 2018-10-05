import {ItemViewPlaceholder} from '../ItemViewPlaceholder';
import {ImageComponentView} from './ImageComponentView';
import {ImageOptionDataLoader} from '../../app/inputtype/ui/selector/image/ImageOptionDataLoader';
import {ImageContentComboBox} from '../../app/inputtype/ui/selector/image/ImageContentComboBox';
import {ImageUploaderEl} from '../../app/inputtype/ui/selector/image/ImageUploaderEl';
import {MediaTreeSelectorItem} from '../../app/inputtype/ui/selector/media/MediaTreeSelectorItem';
import {MediaUploaderElOperation} from '../../app/inputtype/ui/upload/MediaUploaderEl';
import ContentTypeName = api.schema.content.ContentTypeName;
import ImageComponent = api.content.page.region.ImageComponent;
import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;
import UploadedEvent = api.ui.uploader.UploadedEvent;
import i18n = api.util.i18n;

export class ImagePlaceholder
    extends ItemViewPlaceholder {

    private imageComponentView: ImageComponentView;

    private comboBox: ImageContentComboBox;

    private comboboxWrapper: api.dom.DivEl;

    private imageUploader: ImageUploaderEl;

    constructor(imageView: ImageComponentView) {
        super();
        this.addClassEx('image-placeholder').addClass(api.StyleHelper.getCommonIconCls('image'));
        this.imageComponentView = imageView;

        this.initImageCombobox(imageView);
        this.initImageUploader(imageView);
        this.initImageComboboxWrapper();
    }

    private initImageCombobox(imageView: ImageComponentView) {
        let loader = ImageOptionDataLoader.create()
            .setContent(imageView.getLiveEditModel().getContent())
            .setContentTypeNames([ContentTypeName.IMAGE.toString(), ContentTypeName.MEDIA_VECTOR.toString()])
            .build();

        this.comboBox = ImageContentComboBox.create()
            .setMaximumOccurrences(1)
            .setLoader(loader)
            .setContent(imageView.getLiveEditModel().getContent())
            .setTreegridDropdownEnabled(false)
            .setMinWidth(270)
            .build();

        this.comboBox.getComboBox().getInput().setPlaceholder(i18n('field.image.option.placeholder'));
        this.comboBox.onOptionSelected((event: SelectedOptionEvent<MediaTreeSelectorItem>) => {

            let component: ImageComponent = this.imageComponentView.getComponent();
            let imageContent = event.getSelectedOption().getOption().displayValue;

            component.setImage(imageContent.getContentId(), imageContent.getDisplayName());

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

        this.imageUploader.onFileUploaded((event: UploadedEvent<api.content.Content>) => {
            let createdImage = event.getUploadItem().getModel();

            let component: ImageComponent = this.imageComponentView.getComponent();
            component.setImage(createdImage.getContentId(), createdImage.getDisplayName());
        });

        this.imageUploader.addDropzone(this.comboBox.getId());
    }

    private initImageComboboxWrapper() {
        this.comboboxWrapper = new api.dom.DivEl('rich-combobox-wrapper');
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
