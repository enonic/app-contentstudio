import '../../../../../../api.ts';
import {ComponentInspectionPanel, ComponentInspectionPanelConfig} from './ComponentInspectionPanel';
import {ImageSelectorForm} from './ImageSelectorForm';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {ImageComponentView} from '../../../../../../page-editor/image/ImageComponentView';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import ImageComponent = api.content.page.region.ImageComponent;
import ContentSummary = api.content.ContentSummary;
import ContentId = api.content.ContentId;
import GetContentSummaryByIdRequest = api.content.resource.GetContentSummaryByIdRequest;
import ComponentPropertyChangedEvent = api.content.page.region.ComponentPropertyChangedEvent;
import Option = api.ui.selector.Option;
import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;
import ContentSummaryBuilder = api.content.ContentSummaryBuilder;
import i18n = api.util.i18n;
import ImageContentComboBox = api.content.image.ImageContentComboBox;
import ContentSelectedOptionsView = api.content.ContentSelectedOptionsView;
import ImageTreeSelectorItem = api.content.image.ImageTreeSelectorItem;

export class ImageInspectionPanel
    extends ComponentInspectionPanel<ImageComponent> {

    private imageComponent: ImageComponent;

    private imageView: ImageComponentView;

    private formView: api.form.FormView;

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
                if (!this.imageComponent.hasImage()) {
                    this.setupComponentForm(this.imageComponent);
                    this.imageSelector.setContent(null);
                }
            }
        };

        this.initSelectorListeners();
        this.appendChild(this.imageSelectorForm);
    }

    setModel(liveEditModel: LiveEditModel) {
        super.setModel(liveEditModel);
    }

    setComponent(component: ImageComponent) {
        super.setComponent(component);
    }

    setImageComponent(imageView: ImageComponentView) {
        this.imageView = imageView;

        (/*<any>*/this.imageSelector.getLoader()).setContent(this.imageView.getLiveEditModel().getContent());

        if (this.imageComponent) {
            this.unregisterComponentListeners(this.imageComponent);
        }

        this.imageComponent = imageView.getComponent();
        this.setComponent(this.imageComponent);

        const contentId: ContentId = this.imageComponent.getImage();
        if (contentId) {
            const image: ContentSummary = this.imageSelector.getContent(contentId);
            if (image) {
                this.setImage(image);
            } else {
                new GetContentSummaryByIdRequest(contentId).sendAndParse().then((receivedImage: ContentSummary) => {
                    this.setImage(receivedImage);
                }).catch((reason: any) => {
                    if (this.isNotFoundError(reason)) {
                        this.setSelectorValue(null);
                        this.setupComponentForm(this.imageComponent);
                    } else {
                        api.DefaultErrorHandler.handle(reason);
                    }
                }).done();
            }
        } else {
            this.setSelectorValue(null);
            this.setupComponentForm(this.imageComponent);
        }

        this.registerComponentListeners(this.imageComponent);
    }

    private registerComponentListeners(component: ImageComponent) {
        component.onPropertyChanged(this.componentPropertyChangedEventHandler);
    }

    private unregisterComponentListeners(component: ImageComponent) {
        component.unPropertyChanged(this.componentPropertyChangedEventHandler);
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
        this.formView = new api.form.FormView(this.formContext, configForm, configData.getRoot());
        this.appendChild(this.formView);
        imageComponent.setDisableEventForwarding(true);
        this.formView.layout().catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        }).finally(() => {
            imageComponent.setDisableEventForwarding(false);
        }).done();
    }

    private initSelectorListeners() {

        this.imageSelector.onOptionSelected((event: SelectedOptionEvent<ImageTreeSelectorItem>) => {
            if (this.handleSelectorEvents) {
                let option: Option<ImageTreeSelectorItem> = event.getSelectedOption().getOption();
                let imageContent = option.displayValue;
                this.imageComponent.setImage(imageContent.getContentId(), imageContent.getDisplayName());
            }
        });

        this.imageSelector.onOptionDeselected((event: SelectedOptionEvent<ImageTreeSelectorItem>) => {
            if (this.handleSelectorEvents) {
                this.imageComponent.reset();
            }
        });
    }

    private setImage(image: ContentSummary) {
        this.setSelectorValue(image);
        this.setupComponentForm(this.imageComponent);
    }

    getComponentView(): ImageComponentView {
        return this.imageView;
    }

    refresh() {
        if (this.imageComponent) {
            const contentId: ContentId = this.imageComponent.getImage();
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

}
