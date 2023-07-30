import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {ComponentInspectionPanel, ComponentInspectionPanelConfig} from './ComponentInspectionPanel';
import {ImageSelectorForm} from './ImageSelectorForm';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {ImageComponentView} from '../../../../../../page-editor/image/ImageComponentView';
import {GetContentSummaryByIdRequest} from '../../../../../resource/GetContentSummaryByIdRequest';
import {ImageContentComboBox} from '../../../../../inputtype/ui/selector/image/ImageContentComboBox';
import {ContentSelectedOptionsView} from '../../../../../inputtype/ui/selector/ContentComboBox';
import {MediaTreeSelectorItem} from '../../../../../inputtype/ui/selector/media/MediaTreeSelectorItem';
import {ImageComponent} from '../../../../../page/region/ImageComponent';
import {ComponentPropertyChangedEvent} from '../../../../../page/region/ComponentPropertyChangedEvent';
import {Content} from '../../../../../content/Content';
import {GetContentByIdRequest} from '../../../../../resource/GetContentByIdRequest';
import {SelectedOptionEvent} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {ContentServerEventsHandler} from '../../../../../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../../../../../content/ContentSummaryAndCompareStatus';
import {ContentSummary, ContentSummaryBuilder} from '../../../../../content/ContentSummary';
import {ContentId} from '../../../../../content/ContentId';
import {ContentPath} from '../../../../../content/ContentPath';
import {SelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {ComponentPropertyChangedEventHandler, ComponentUpdatedEventHandler} from '../../../../../page/region/Component';
import {ComponentUpdatedEvent} from '../../../../../page/region/ComponentUpdatedEvent';
import {PageState} from '../../../PageState';
import {ComponentDescriptorUpdatedEvent} from '../../../../../page/region/ComponentDescriptorUpdatedEvent';
import {ComponentImageUpdatedEvent} from '../../../../../page/region/ComponentImageUpdatedEvent';

export class ImageInspectionPanel
    extends ComponentInspectionPanel<ImageComponent> {

    private formView: FormView;

    private readonly imageSelector: ImageContentComboBox;

    private readonly imageSelectorForm: ImageSelectorForm;

    private handleSelectorEvents: boolean = true;

    private componentUpdateHandler: ComponentUpdatedEventHandler;

    constructor() {
        super(<ComponentInspectionPanelConfig>{
            iconClass: ItemViewIconClassResolver.resolveByType('image', 'icon-xlarge')
        });

        this.imageSelector = ImageContentComboBox
            .create()
            .setMaximumOccurrences(1)
            .setSelectedOptionsView(new ContentSelectedOptionsView() as SelectedOptionsView<any>)
            .build();

        this.imageSelectorForm = new ImageSelectorForm(this.imageSelector, i18n('field.image'));

        this.componentUpdateHandler = (event: ComponentUpdatedEvent): void => {
            // Ensure displayed config form and selector option are removed when image is removed
            if (event instanceof ComponentImageUpdatedEvent && event.getPath().equals(this.component?.getPath())) {
                if (!event.getImageId()) {
                    this.setupComponentForm(this.component);
                    this.imageSelector.setContent(null);
                }
            }
        };

        this.initSelectorListeners();
        this.initListeners();
        this.appendChild(this.imageSelectorForm);
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
            PageState.getEventsManager().onComponentUpdated(this.componentUpdateHandler);
        }
    }

    private unregisterComponentListeners() {
        if (this.component) {
            PageState.getEventsManager().unComponentUpdated(this.componentUpdateHandler);
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
                const imageContentSummary: ContentSummary = (option.getDisplayValue()).getContentSummary();

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

    private initListeners() {
        ContentServerEventsHandler.getInstance().onContentUpdated(this.handleUpdateEvent.bind(this));
        ContentServerEventsHandler.getInstance().onContentRenamed(this.handleRenameEvent.bind(this));
    }

    private handleRenameEvent(renamedItems: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) {
        if (this.isSelectedImageRenamed(renamedItems, oldPaths)) {
            this.reloadSelectedImage();
        }
    }

    private isSelectedImageRenamed(renamedItems: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]): boolean {
        if (!this.component || !this.component.hasImage()) {
            return false;
        }

        const selectedImage: ContentSummary = this.imageSelector.getSelectedContent();

        if (!selectedImage) {
            return false;
        }

        const selectedImagePath: ContentPath = selectedImage.getPath();

        return renamedItems.some((item: ContentSummaryAndCompareStatus) => item.getContentId().equals(selectedImage.getContentId()))
               || oldPaths.some((oldPath: ContentPath) => selectedImagePath.isDescendantOf(oldPath));
    }

    private handleUpdateEvent(updatedItems: ContentSummaryAndCompareStatus[]) {
        if (updatedItems.some((item: ContentSummaryAndCompareStatus) => this.hasSelectedImage(item.getContentId()))) {
            this.reloadSelectedImage();
        }
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

    private reloadSelectedImage() {
        if (this.component && this.component.hasImage()) {
            new GetContentByIdRequest(this.component.getImage()).sendAndParse().then((receivedImage: Content) => {
                this.component.setImage(receivedImage);
                this.imageSelector.clearCombobox();
                this.imageSelector.removeAllOptions();
                this.setImage(receivedImage);
            }).catch(DefaultErrorHandler.handle);
        }
    }

    private hasSelectedImage(contentId: ContentId): boolean {
        return !!this.component && this.component.hasImage() && this.component.getImage().equals(contentId);
    }

    cleanUp() {
        this.unregisterComponentListeners();
        this.component = null;
    }

    getName(): string {
        return i18n('widget.components.insert.image');
    }

}
