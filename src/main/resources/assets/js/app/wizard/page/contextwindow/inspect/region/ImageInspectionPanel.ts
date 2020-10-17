import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary, ContentSummaryBuilder} from 'lib-admin-ui/content/ContentSummary';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {ComponentInspectionPanel, ComponentInspectionPanelConfig} from './ComponentInspectionPanel';
import {ImageSelectorForm} from './ImageSelectorForm';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {ImageComponentView} from '../../../../../../page-editor/image/ImageComponentView';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {GetContentSummaryByIdRequest} from '../../../../../resource/GetContentSummaryByIdRequest';
import {ImageContentComboBox} from '../../../../../inputtype/ui/selector/image/ImageContentComboBox';
import {ContentSelectedOptionsView} from '../../../../../inputtype/ui/selector/ContentComboBox';
import {MediaTreeSelectorItem} from '../../../../../inputtype/ui/selector/media/MediaTreeSelectorItem';
import {ImageComponent} from '../../../../../page/region/ImageComponent';
import {ComponentPropertyChangedEvent} from '../../../../../page/region/ComponentPropertyChangedEvent';
import {Content} from '../../../../../content/Content';
import {GetContentByIdRequest} from '../../../../../resource/GetContentByIdRequest';
import {SelectedOptionEvent} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {FormView} from 'lib-admin-ui/form/FormView';

export class ImageInspectionPanel
    extends ComponentInspectionPanel<ImageComponent> {

    private formView: FormView;

    private imageSelector: ImageContentComboBox;

    private imageSelectorForm: ImageSelectorForm;

    private handleSelectorEvents: boolean = true;

    private componentPropertyChangedEventHandler: (event: ComponentPropertyChangedEvent) => void;

    constructor() {
        super(<ComponentInspectionPanelConfig>{
            iconClass: ItemViewIconClassResolver.resolveByType('image', 'icon-xlarge')
        });

        this.imageSelector = ImageContentComboBox
            .create()
            .setMaximumOccurrences(1)
            .setSelectedOptionsView(new ContentSelectedOptionsView())
            .build();

        this.imageSelectorForm = new ImageSelectorForm(this.imageSelector, i18n('field.image'));

        this.componentPropertyChangedEventHandler = (event: ComponentPropertyChangedEvent) => {
            // Ensure displayed config form and selector option are removed when image is removed
            if (event.getPropertyName() === ImageComponent.PROPERTY_IMAGE) {
                if (!this.component.hasImage()) {
                    this.setupComponentForm(this.component);
                    this.imageSelector.setContent(null);
                }
            }
        };

        this.initSelectorListeners();
        this.appendChild(this.imageSelectorForm);
    }

    setImageComponentView(imageView: ImageComponentView) {
        (/*<any>*/this.imageSelector.getLoader()).setContent(imageView.getLiveEditModel().getContent());
    }

    setImageComponent(component: ImageComponent) {
        this.unregisterComponentListeners();

        this.setComponent(component);
        this.updateImage();

        this.registerComponentListeners();
    }

    private updateImage() {
        const contentId: ContentId = this.component.getImage();
        if (contentId) {
            const image: ContentSummary = this.imageSelector.getContent(contentId);
            if (image) {
                this.setImage(image);
            } else {
                new GetContentSummaryByIdRequest(contentId).sendAndParse().then((receivedImage: ContentSummary) => {
                    this.imageSelector.clearSelection(true);
                    this.setImage(receivedImage);
                }).catch((reason: any) => {
                    if (this.isNotFoundError(reason)) {
                        this.setSelectorValue(null);
                        this.setupComponentForm(this.component);
                    } else {
                        DefaultErrorHandler.handle(reason);
                    }
                }).done();
            }
        } else {
            this.setSelectorValue(null);
            this.setupComponentForm(this.component);
        }
    }

    private registerComponentListeners() {
        if (this.component) {
            this.component.onPropertyChanged(this.componentPropertyChangedEventHandler);
        }
    }

    private unregisterComponentListeners() {
        if (this.component) {
            this.component.unPropertyChanged(this.componentPropertyChangedEventHandler);
        }
    }

    private setSelectorValue(image: ContentSummary) {
        this.handleSelectorEvents = false;
        this.imageSelector.setContent(image);
        this.handleSelectorEvents = true;
    }

    private setupComponentForm(imageComponent: ImageComponent) {
        if (this.formView) {
            this.removeChild(this.formView);
            this.formView = null;
        }
        let configData = imageComponent.getConfig();
        let configForm = imageComponent.getForm();
        this.formView = new FormView(this.formContext, configForm, configData.getRoot());
        this.formView.setLazyRender(false);
        this.appendChild(this.formView);
        this.formView.setVisible(this.component.hasImage());
        imageComponent.setDisableEventForwarding(true);
        this.formView.layout().catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        }).finally(() => {
            imageComponent.setDisableEventForwarding(false);
        }).done();
    }

    private initSelectorListeners() {

        this.imageSelector.onOptionSelected((event: SelectedOptionEvent<MediaTreeSelectorItem>) => {
            if (this.handleSelectorEvents) {
                const option: Option<MediaTreeSelectorItem> = event.getSelectedOption().getOption();
                const imageContentSummary: ContentSummary = (<MediaTreeSelectorItem>option.displayValue).getContentSummary();

                new GetContentByIdRequest(imageContentSummary.getContentId()).sendAndParse().then((imageContent: Content) => {
                    this.component.setImage(imageContent);
                }).catch(DefaultErrorHandler.handle);

            }
        });

        this.imageSelector.onOptionDeselected((event: SelectedOptionEvent<MediaTreeSelectorItem>) => {
            if (this.handleSelectorEvents) {
                this.component.reset();
            }
        });
    }

    private setImage(image: ContentSummary) {
        this.setSelectorValue(image);
        this.setupComponentForm(this.component);
    }

    refresh() {
        if (this.component) {
            const contentId: ContentId = this.component.getImage();
            if (contentId) {
                const image: ContentSummary = this.imageSelector.getContent(contentId);
                if (image) {
                    const newImage: ContentSummary = new ContentSummaryBuilder(image).setIconUrl(image.getIconUrl() + '1').build();
                    this.imageSelector.clearCombobox();
                    this.imageSelector.removeAllOptions();
                    this.setImage(newImage);
                }
            }
        }
    }

    cleanUp() {
        this.unregisterComponentListeners();
        this.component = null;
    }

    getName(): string {
        return i18n('widget.components.insert.image');
    }

}
