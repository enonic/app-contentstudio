import FormItem = api.ui.form.FormItem;
import Validators = api.ui.form.Validators;
import FileUploadedEvent = api.ui.uploader.FileUploadedEvent;
import FileUploadProgressEvent = api.ui.uploader.FileUploadProgressEvent;
import OptionSelectedEvent = api.ui.selector.OptionSelectedEvent;
import Action = api.ui.Action;
import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;
import ContentSummary = api.content.ContentSummary;
import Content = api.content.Content;
import Option = api.ui.selector.Option;
import eventInfo = CKEDITOR.eventInfo;
import ContentId = api.content.ContentId;
import i18n = api.util.i18n;
import MediaTreeSelectorItem = api.content.media.MediaTreeSelectorItem;
import AppHelper = api.util.AppHelper;
import {OverrideNativeDialog} from './../OverrideNativeDialog';
import {HtmlAreaModalDialogConfig, ModalDialogFormItemBuilder} from './../ModalDialog';
import {ImageCroppingSelector} from './ImageCroppingSelector';
import {ImageCroppingOption} from './ImageCroppingOption';
import {ImageCroppingOptions} from './ImageCroppingOptions';
import {ImageStylesRequest} from './ImageStylesRequest';
import {ImageStyles} from './ImageStyles';
import {HTMLAreaHelper} from '../../HTMLAreaHelper';
import {ImageUrlParameters} from '../../../../../util/ImageUrlResolver';

/**
 * NB: Modifications were made for native image plugin in image2/plugin.js:
 * 1. setWrapperAlign() method updated to make image wrapper element have inline alignment styles we used to have
 * 2. align updated to behave same is in tiny
 * 3. widget's'data.lock' is used to store keepSize value; init value of 'data.lock' set by keepSize param value;
 * 4. unwrapFromCentering() updated to correctly handle image alignment with respect to figure tag
 * 5. hasCaption() updated to wrap image into figure tag on drag and drop
 * 6. figcaption related code fixed to work as in tinymce
 * 7. updated image plugin to enable justify button on toolbar
 * 8. centered figure will have 'display: block' instead of inline-block to properly display svg. UPD: no display style to correspond
 * with tinymce styles
 *
 * NB: Modifications were made in ckeditor.js (VERY SORRY FOR THAT):
 * LINE 1279: updateDragHandlerPosition() function updated to set inline style 'display: none;' on drag handler container
 *
 * Update those in case ckeditor lib is updated
 */
export class ImageModalDialog
    extends OverrideNativeDialog {

    private imagePreviewContainer: api.dom.DivEl;
    private imageCaptionField: FormItem;
    private imageAltTextField: FormItem;
    private imageUploaderEl: api.content.image.ImageUploaderEl;
    private imageElement: HTMLImageElement;
    private content: api.content.ContentSummary;
    private imageSelector: api.content.image.ImageContentComboBox;
    private progress: api.ui.ProgressBar;
    private error: api.dom.DivEl;
    private image: api.dom.ImgEl;
    private imageToolbar: ImageDialogToolbar;
    private imagePreviewScrollHandler: ImagePreviewScrollHandler;
    private imageLoadMask: api.ui.mask.LoadMask;
    private dropzoneContainer: api.ui.uploader.DropzoneContainer;
    private imageSelectorFormItem: FormItem;

    constructor(config: eventInfo, content: api.content.ContentSummary) {
        super(<HtmlAreaModalDialogConfig>{
            editor: config.editor,
            dialog: config.data,
            content: content,
            title: i18n('dialog.image.title'),
            cls: 'image-modal-dialog',
            confirmation: {
                yesCallback: () => this.getSubmitAction().execute(),
                noCallback: () => this.close(),
            }
        });

        this.initLoader();

        if (this.getOriginalUrlElem().getValue()) {
            this.imageElement = (<any>this.getEditor().widgets).selected[0].parts.image.$;
            this.loadImage();
        }

        if (!ImageStyles.get()) {
            new ImageStylesRequest().sendAndParse();
        }

    }

    protected initializeConfig(params: ImageModalDialogConfig) {
        super.initializeConfig(params);

        this.content = params.content;
    }

    protected setDialogInputValues() {
        const caption: string = !!this.ckeOriginalDialog.getSelectedElement()
                                ? this.ckeOriginalDialog.getSelectedElement().getText()
                                : '';
        (<api.dom.InputEl>this.imageCaptionField.getInput()).setValue(caption);
        (<api.dom.InputEl>this.imageAltTextField.getInput()).setValue(this.getOriginalAltTextElem().getValue());
    }

    private initLoader() {
        this.imageUploaderEl.setParams({
            parent: this.content.getContentId().toString()
        });
    }

    private loadImage() {
        const imageId: string = this.extractImageId();

        new api.content.resource.GetContentByIdRequest(new ContentId(imageId)).sendAndParse().then((imageContent: Content) => {
            this.imageSelector.setValue(imageContent.getId());
            this.createImgElForExistingImage(imageContent);
            this.previewImage();
            this.imageSelectorFormItem.addClass('selected-item-preview');
        }).catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        }).done();
    }

    private extractImageId(): string {
        const src: string = this.imageElement.getAttribute('data-src');

        if (!src) {
            throw new Error('Incorrectly formatted URL');
        }

        return HTMLAreaHelper.extractContentIdFromImgSrc(src);
    }
    protected getMainFormItems(): FormItem[] {
        this.imageSelectorFormItem = this.createImageSelector('imageId');

        this.addUploaderAndPreviewControls();
        this.setFirstFocusField(this.imageSelectorFormItem.getInput());

        this.imageCaptionField = this.createFormItem(new ModalDialogFormItemBuilder('caption', i18n('dialog.image.formitem.caption')));
        this.imageAltTextField = this.createFormItem(new ModalDialogFormItemBuilder('altText', i18n('dialog.image.formitem.alttext')));

        this.imageCaptionField.addClass('caption').hide();
        this.imageAltTextField.addClass('alttext').hide();

        return [
            this.imageSelectorFormItem,
            this.imageCaptionField,
            this.imageAltTextField
        ];
    }

    private createImageSelector(id: string): FormItem {

        const imageSelector = api.content.image.ImageContentComboBox.create().setMaximumOccurrences(1).setContent(
            this.content).setSelectedOptionsView(new api.content.ContentSelectedOptionsView()).build();

        const formItemBuilder = new ModalDialogFormItemBuilder(id, i18n('dialog.image.formitem.image')).setValidator(
            Validators.required).setInputEl(imageSelector);

        const formItem = this.createFormItem(formItemBuilder);
        const imageSelectorComboBox = imageSelector.getComboBox();

        imageSelector.getComboBox().getInput().setPlaceholder(i18n('field.image.option.placeholder'));

        this.imageSelector = imageSelector;

        formItem.addClass('image-selector');

        imageSelectorComboBox.onOptionSelected((event: SelectedOptionEvent<MediaTreeSelectorItem>) => {
            const imageContent = event.getSelectedOption().getOption().displayValue;
            if (!imageContent.getContentId()) {
                return;
            }

            this.imageLoadMask.show();
            this.createImgElForNewImage(imageContent);
            this.previewImage();
            formItem.addClass('selected-item-preview');
            this.setAltTextFieldValue(imageContent.getDisplayName());
            this.fetchImageCaption(imageContent.getContentSummary()).then(value => this.setCaptionFieldValue(value)).catch(
                (reason: any) => api.DefaultErrorHandler.handle(reason)).done();
        });

        imageSelectorComboBox.onOptionDeselected(() => {
            formItem.removeClass('selected-item-preview');
            this.displayValidationErrors(false);
            this.removePreview();
            this.imageToolbar.remove();
            this.imageCaptionField.hide();
            this.imageAltTextField.hide();
            this.imageUploaderEl.show();
            this.imagePreviewScrollHandler.toggleScrollButtons();
            api.ui.responsive.ResponsiveManager.fireResizeEvent();
        });

        return formItem;
    }

    private addUploaderAndPreviewControls() {
        const imageSelectorContainer = this.imageSelectorFormItem.getInput().getParentElement();

        imageSelectorContainer.appendChild(this.imageUploaderEl = this.createImageUploader());
        this.initDragAndDropUploaderEvents();

        this.createImagePreviewContainer();

        const scrollBarWrapperDiv = new api.dom.DivEl('preview-panel-scrollbar-wrapper');
        scrollBarWrapperDiv.appendChild(this.imagePreviewContainer);
        const scrollNavigationWrapperDiv = new api.dom.DivEl('preview-panel-scroll-navigation-wrapper');
        scrollNavigationWrapperDiv.appendChild(scrollBarWrapperDiv);

        wemjq(scrollNavigationWrapperDiv.getHTMLElement()).insertAfter(imageSelectorContainer.getHTMLElement());

        this.imagePreviewScrollHandler = new ImagePreviewScrollHandler(this.imagePreviewContainer);

        this.imageLoadMask = new api.ui.mask.LoadMask(this.imagePreviewContainer);
        this.imagePreviewContainer.appendChild(this.imageLoadMask);

        api.ui.responsive.ResponsiveManager.onAvailableSizeChanged(this, () => {
            this.imagePreviewScrollHandler.toggleScrollButtons();
            this.imagePreviewScrollHandler.setMarginRight();
        });
    }

    private createImgElForExistingImage(imageContent: Content) {
        this.image = this.createImgElForPreview(imageContent.getContentId().toString(), true);
    }

    private createImgElForNewImage(imageContent: MediaTreeSelectorItem) {
        this.image = this.createImgElForPreview(imageContent.getContentId().toString(), false);
    }

    private previewImage() {
        this.imageToolbar = new ImageDialogToolbar(this.image, this.imageLoadMask, this.imageSelector.getValue());
        this.imageToolbar.onCroppingChanged(() => {
            this.imagePreviewScrollHandler.resetScrollPosition();
        });

        this.image.onLoaded(() => {
            this.imageLoadMask.hide();
            this.imagePreviewContainer.removeClass('upload');
            wemjq(this.imageToolbar.getHTMLElement()).insertBefore(
                this.imagePreviewContainer.getHTMLElement().parentElement.parentElement);
            api.ui.responsive.ResponsiveManager.fireResizeEvent();
        });

        this.hideUploadMasks();
        this.imageCaptionField.show();
        this.imageAltTextField.show();
        this.imageUploaderEl.hide();
        this.imagePreviewContainer.insertChild(this.image, 0);
    }

    private createImgElForPreview(imageContentId: string, isExistingImg: boolean = false): api.dom.ImgEl {
        const imgSrcAttr = isExistingImg
                           ? new api.dom.ElementHelper(this.imageElement).getAttribute('src')
                           : HTMLAreaHelper.getImagePreviewUrl({id: imageContentId});
        const imgDataSrcAttr = isExistingImg
                               ? new api.dom.ElementHelper(this.imageElement).getAttribute('data-src')
                               :  HTMLAreaHelper.getImageRenderUrl({id: imageContentId});

        const imageEl = new api.dom.ImgEl(imgSrcAttr);
        imageEl.getEl().setAttribute('data-src', imgDataSrcAttr);

        const imageAlignment = this.getOriginalAlignmentElem().getValue();
        imageEl.getHTMLElement().style.textAlign = imageAlignment;

        return imageEl;
    }

    private removePreview() {
        this.imagePreviewContainer.removeChild(this.image);
    }

    show() {
        super.show();

        this.imageUploaderEl.show();
    }

    private createImagePreviewContainer() {
        const imagePreviewContainer = new api.dom.DivEl('content-item-preview-panel');

        this.progress = new api.ui.ProgressBar();
        imagePreviewContainer.appendChild(this.progress);

        this.error = new api.dom.DivEl('error');
        imagePreviewContainer.appendChild(this.error);

        this.imagePreviewContainer = imagePreviewContainer;
    }

    private createImageUploader(): api.content.image.ImageUploaderEl {
        const uploader = new api.content.image.ImageUploaderEl({
            operation: api.ui.uploader.MediaUploaderElOperation.create,
            name: 'image-selector-upload-dialog',
            showResult: false,
            maximumOccurrences: 1,
            allowMultiSelection: false,
            deferred: true,
            showCancel: false,
            selfIsDropzone: false
        });

        this.dropzoneContainer = new api.ui.uploader.DropzoneContainer(true);
        this.dropzoneContainer.hide();
        this.appendChild(this.dropzoneContainer);

        uploader.addDropzone(this.dropzoneContainer.getDropzone().getId());

        uploader.hide();

        uploader.onUploadStarted(() => {
            this.hideUploadMasks();
            this.imagePreviewContainer.addClass('upload');
            this.showProgress();
        });

        uploader.onUploadProgress((event: FileUploadProgressEvent<Content>) => {
            const item = event.getUploadItem();

            this.setProgress(item.getProgress());
        });

        uploader.onFileUploaded((event: FileUploadedEvent<Content>) => {
            const item = event.getUploadItem();
            const createdContent = item.getModel();

            this.imageSelector.setContent(createdContent);
        });

        uploader.onUploadFailed(() => {
            this.showError('Upload failed');
        });

        return uploader;
    }

    private initDragAndDropUploaderEvents() {
        let dragOverEl;
        this.onDragEnter((event: DragEvent) => {
            if (this.imageUploaderEl.isEnabled()) {
                const target = <HTMLElement> event.target;

                if (!!dragOverEl || dragOverEl === this.getHTMLElement()) {
                    this.dropzoneContainer.show();
                }
                dragOverEl = target;
            }
        });

        this.imageUploaderEl.onDropzoneDragLeave(() => this.dropzoneContainer.hide());
        this.imageUploaderEl.onDropzoneDrop(() => this.dropzoneContainer.hide());
    }

    private setProgress(value: number) {
        this.progress.setValue(value);
    }

    private showProgress() {
        this.progress.show();
    }

    private hideUploadMasks() {
        this.progress.hide();
        this.error.hide();
    }

    private showError(text: string) {
        this.progress.hide();
        this.error.setHtml(text).show();
        this.error.show();
    }

    protected initializeActions() {
        const submitAction = new api.ui.Action(this.imageElement ? 'Update' : 'Insert');
        this.setSubmitAction(submitAction);
        this.addAction(submitAction.onExecuted(() => {
            this.displayValidationErrors(true);
            if (this.validate()) {
                this.updateOriginalDialogInputValues();
                this.ckeOriginalDialog.getButton('ok').click();
                (<any>this.ckeOriginalDialog).widget.parts.image.setAttribute('data-src',
                    this.image.getEl().getAttribute('data-src'));
                this.setCaptionText();
                this.close();
            }
        }));

        super.initializeActions();
    }

    private updateOriginalDialogInputValues(): void {
        const src: string = this.image.getEl().getAttribute('src');
        const altText: string = this.getAltTextFieldValue();
        const alignment: string = this.image.getHTMLElement().style.textAlign;
        const keepSize: boolean = this.image.getEl().getAttribute('data-src').indexOf('keepSize=true') > 0;

        this.getOriginalUrlElem().setValue(src, false);
        this.getOriginalAltTextElem().setValue(altText, false);
        this.getOriginalHasCaptionElem().setValue(true, false);
        this.getOriginalAlignmentElem().setValue(alignment, false);
        // using plugin's lock button state to tell it if keepSize is true or not
        // plugin is modified to set required inline styles
        if (('' + keepSize) !== this.getOriginalLockElem().$.getAttribute('aria-checked')) {
            this.getOriginalLockElem().$.click();
        }
    }

    private setCaptionFieldValue(value: string) {
        (<api.dom.InputEl>this.imageCaptionField.getInput()).setValue(value);
    }

    private setCaptionText() {
        (<any>this.ckeOriginalDialog).widget.parts.image.getAscendant('figure').findOne('figcaption').$.textContent =
            this.getCaptionFieldValue();
    }

    private getCaptionFieldValue() {
        return (<api.dom.InputEl>this.imageCaptionField.getInput()).getValue().trim();
    }

    private getAltTextFieldValue() {
        return (<api.dom.InputEl>this.imageAltTextField.getInput()).getValue().trim();
    }

    private setAltTextFieldValue(value: string) {
        (<api.dom.InputEl>this.imageAltTextField.getInput()).setValue(value);
    }

    private fetchImageCaption(imageContent: ContentSummary): wemQ.Promise<string> {
        return new api.content.resource.GetContentByIdRequest(imageContent.getContentId()).sendAndParse()
            .then((content: api.content.Content) => {
                return this.getDescriptionFromImageContent(content) || content.getProperty('caption').getString() || '';
            });
    }

    private getDescriptionFromImageContent(imageContent: Content): string {
        const imageInfoMixin = new api.schema.xdata.XDataName('media:imageInfo');
        const imageInfoData = imageContent.getExtraData(imageInfoMixin);

        if (!imageInfoData || !imageInfoData.getData()) {
            return null;
        }

        const descriptionProperty = imageInfoData.getData().getProperty('description');

        if (descriptionProperty) {
            const description = descriptionProperty.getString();
            if (description) {
                return description;
            }
        }

        return null;
    }

    private getOriginalUrlElem(): CKEDITOR.ui.dialog.uiElement {
        return (<any>this.getElemFromOriginalDialog('info', undefined)).getChild(0);
    }

    private getOriginalAltTextElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'alt');
    }

    private getOriginalHasCaptionElem(): CKEDITOR.ui.dialog.checkbox {
        return <CKEDITOR.ui.dialog.checkbox>this.getElemFromOriginalDialog('info', 'hasCaption');
    }

    private getOriginalAlignmentElem(): CKEDITOR.ui.dialog.uiElement {
        return (<any>this.getElemFromOriginalDialog('info', 'alignment')).getChild(0);
    }

    private getOriginalLockElem(): CKEDITOR.dom.element {
        return (<any>this.getElemFromOriginalDialog('info', 'lock')).getElement().getChild(0);
    }

    isDirty(): boolean {
        return AppHelper.isDirty(this);
    }
}

export class ImageModalDialogConfig
    extends HtmlAreaModalDialogConfig {
    content: api.content.ContentSummary;
}

export class ImageDialogToolbar
    extends api.ui.toolbar.Toolbar {

    private image: api.dom.ImgEl;

    private imageId: string;

    private justifyButton: api.ui.button.ActionButton;

    private alignLeftButton: api.ui.button.ActionButton;

    private centerButton: api.ui.button.ActionButton;

    private alignRightButton: api.ui.button.ActionButton;

    private keepOriginalSizeCheckbox: api.ui.Checkbox;

    private imageCroppingSelector: ImageCroppingSelector;

    private imageLoadMask: api.ui.mask.LoadMask;

    constructor(image: api.dom.ImgEl, imageLoadMask: api.ui.mask.LoadMask, imageId: string) {
        super('image-toolbar');

        this.image = image;
        this.imageId = imageId;
        this.imageLoadMask = imageLoadMask;

        super.addElement(this.justifyButton = this.createJustifiedButton());
        super.addElement(this.alignLeftButton = this.createLeftAlignedButton());
        super.addElement(this.centerButton = this.createCenteredButton());
        super.addElement(this.alignRightButton = this.createRightAlignedButton());
        super.addElement(this.keepOriginalSizeCheckbox = this.createKeepOriginalSizeCheckbox());
        //super.addElement(this.imageCroppingSelector = this.createImageCroppingSelector());
        super.addElement(this.imageCroppingSelector = this.createImageCroppingSelector());

        this.initKeepSizeCheckbox();
        this.initActiveButton();
    }

    private createJustifiedButton(): api.ui.button.ActionButton {
        return this.createAlignmentButton('icon-paragraph-justify');
    }

    private createLeftAlignedButton(): api.ui.button.ActionButton {
        return this.createAlignmentButton('icon-paragraph-left');
    }

    private createCenteredButton(): api.ui.button.ActionButton {
        return this.createAlignmentButton('icon-paragraph-center');
    }

    private createRightAlignedButton(): api.ui.button.ActionButton {
        return this.createAlignmentButton('icon-paragraph-right');
    }

    private createAlignmentButton(iconClass: string): api.ui.button.ActionButton {
        const action: Action = new Action('');

        action.setIconClass(iconClass);

        const button = new api.ui.button.ActionButton(action);

        action.onExecuted(() => {
            this.resetActiveButton();
            button.addClass('active');
            this.image.getHTMLElement().style.textAlign = this.getImageAlignment();
            api.ui.responsive.ResponsiveManager.fireResizeEvent();
        });

        return button;
    }

    private refreshImagePreview() {
        this.imageLoadMask.show();
        this.setImageSrc();
        api.ui.responsive.ResponsiveManager.fireResizeEvent();
    }

    private createKeepOriginalSizeCheckbox(): api.ui.Checkbox {
        const keepOriginalSizeCheckbox = api.ui.Checkbox.create().build();
        keepOriginalSizeCheckbox.addClass('keep-size-check');
        keepOriginalSizeCheckbox.onValueChanged(() => this.refreshImagePreview());
        keepOriginalSizeCheckbox.setLabel(i18n('dialog.image.keepsize'));

        return keepOriginalSizeCheckbox;
    }

    private createImageCroppingSelector(): ImageCroppingSelector {
        const imageCroppingSelector: ImageCroppingSelector = new ImageCroppingSelector();

        this.initSelectedCropping(imageCroppingSelector);

        imageCroppingSelector.onOptionSelected(() => this.refreshImagePreview());

        return imageCroppingSelector;
    }

    private initSelectedCropping(imageCroppingSelector: ImageCroppingSelector) {
        const imgSrc: string = this.image.getEl().getAttribute('src');
        const scalingApplied: boolean = imgSrc.indexOf('scale=') > 0;
        if (scalingApplied) {
            const scaleParamValue = api.util.UriHelper.decodeUrlParams(imgSrc.replace('&amp;', '&'))['scale'];
            const scaleOption = ImageCroppingOptions.get().getOptionByProportion(scaleParamValue);
            if (!!scaleOption) {
                imageCroppingSelector.selectOption(imageCroppingSelector.getOptionByValue(scaleOption.getName()));
            } else {
                const customOption: Option<ImageCroppingOption> = imageCroppingSelector.addCustomScaleOption(scaleParamValue);
                if (!!customOption) {
                    imageCroppingSelector.selectOption(customOption);
                }
            }
        }
    }

    private initActiveButton() {
        const alignment = this.image.getHTMLElement().style.textAlign;

        switch (alignment) {
        case 'justify':
            this.justifyButton.addClass('active');
            break;
        case 'left':
            this.alignLeftButton.addClass('active');
            break;
        case 'center':
            this.centerButton.addClass('active');
            break;
        case 'right':
            this.alignRightButton.addClass('active');
            break;
        default:
            this.justifyButton.addClass('active');
            break;
        }
    }

    private resetActiveButton() {
        this.justifyButton.removeClass('active');
        this.alignLeftButton.removeClass('active');
        this.centerButton.removeClass('active');
        this.alignRightButton.removeClass('active');
    }

    private initKeepSizeCheckbox() {
        this.keepOriginalSizeCheckbox.setChecked(this.image.getEl().getAttribute('data-src').indexOf('keepSize=true') > 0);
    }

    private getImageAlignment(): string {
        if (this.justifyButton.hasClass('active')) {
            return 'justify';
        }

        if (this.alignLeftButton.hasClass('active')) {
            return 'left';
        }

        if (this.centerButton.hasClass('active')) {
            return 'center';
        }

        if (this.alignRightButton.hasClass('active')) {
            return 'right';
        }

        return 'justify';
    }

    private setImageSrc() {
        const isCroppingSelected: boolean = !!this.imageCroppingSelector.getSelectedOption();
        const imageEl = this.image.getEl();
        const imageUrlParams: ImageUrlParameters = {
            id: this.imageId,
            useActualWidth: this.keepOriginalSizeCheckbox.isChecked(),
            scale: isCroppingSelected ? this.imageCroppingSelector.getSelectedOption().displayValue.getProportionString() : ''
        };

        imageEl.setAttribute('src', HTMLAreaHelper.getImagePreviewUrl(imageUrlParams));
        imageEl.setAttribute('data-src', HTMLAreaHelper.getImageRenderUrl(imageUrlParams));
    }

    onCroppingChanged(listener: (event: OptionSelectedEvent<ImageCroppingOption>) => void) {
        this.imageCroppingSelector.onOptionSelected(listener);
    }
}

export class ImagePreviewScrollHandler {

    private imagePreviewContainer: api.dom.DivEl;

    private scrollDownButton: api.dom.Element;
    private scrollUpButton: api.dom.Element;
    private scrollBarWidth: number;
    private scrollBarRemoveTimeoutId: number;
    private scrolling: boolean;

    constructor(imagePreviewContainer: api.dom.DivEl) {
        this.imagePreviewContainer = imagePreviewContainer;

        this.initializeImageScrollNavigation();

        this.imagePreviewContainer.onScroll(() => {
            this.toggleScrollButtons();
            this.showScrollBar();
            this.removeScrollBarOnTimeout();
        });
    }

    private initializeImageScrollNavigation() {
        this.scrollDownButton = this.createScrollButton('down');
        this.scrollUpButton = this.createScrollButton('up');
        this.initScrollbarWidth();
    }

    private isScrolledToTop(): boolean {
        const element = this.imagePreviewContainer.getHTMLElement();
        return element.scrollTop === 0;
    }

    private isScrolledToBottom(): boolean {
        const element = this.imagePreviewContainer.getHTMLElement();
        return (element.scrollHeight - element.scrollTop) === element.clientHeight;
    }

    private createScrollButton(direction: string): api.dom.Element {
        const scrollAreaDiv = new api.dom.DivEl(direction === 'up' ? 'scroll-up-div' : 'scroll-down-div');
        const arrow = new api.dom.DivEl('arrow');
        const scrollTop = (direction === 'up' ? '-=50' : '+=50');

        scrollAreaDiv.appendChild(arrow);

        arrow.onClicked((event) => {
            event.preventDefault();
            this.scrolling = false;
            wemjq(this.imagePreviewContainer.getHTMLElement()).animate({scrollTop: scrollTop}, 400);
        });

        arrow.onMouseOver(() => {
            this.scrolling = true;
            this.scrollImagePreview(direction);
        });

        arrow.onMouseOut(() => {
            this.scrolling = false;
        });

        direction === 'up'
        ? wemjq(scrollAreaDiv.getHTMLElement()).insertBefore(this.imagePreviewContainer.getHTMLElement().parentElement)
        : wemjq(scrollAreaDiv.getHTMLElement()).insertAfter(this.imagePreviewContainer.getHTMLElement().parentElement);

        scrollAreaDiv.hide();

        return scrollAreaDiv;
    }

    private initScrollbarWidth() {
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.width = '100px';
        outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps

        document.body.appendChild(outer);

        const widthNoScroll = outer.offsetWidth;
        // force scrollbars
        outer.style.overflow = 'scroll';

        // add innerdiv
        const inner = document.createElement('div');
        inner.style.width = '100%';
        outer.appendChild(inner);

        const widthWithScroll = inner.offsetWidth;

        // remove divs
        outer.parentNode.removeChild(outer);

        this.scrollBarWidth = widthNoScroll - widthWithScroll;
    }

    private scrollImagePreview(direction: string, scrollBy: number = 2) {
        const scrollByPx = (direction === 'up' ? '-=' : '+=') + Math.round(scrollBy) + 'px';
        const delta = 0.05;
        wemjq(this.imagePreviewContainer.getHTMLElement()).animate({scrollTop: scrollByPx}, 1, () => {
            if (this.scrolling) {
                // If we want to keep scrolling, call the scrollContent function again:
                this.scrollImagePreview(direction, scrollBy + delta);   // Increase scroll height by delta on each iteration
                                                                        // to emulate scrolling speed up effect
            }
        });
    }

    setMarginRight() {
        this.imagePreviewContainer.getEl().setMarginRight('');
        if (this.scrollDownButton.isVisible() || this.scrollUpButton.isVisible()) {
            this.imagePreviewContainer.getEl().setMarginRight('-' + this.scrollBarWidth + 'px');
        }
    }

    toggleScrollButtons() {
        if (this.isScrolledToBottom()) {
            this.scrollDownButton.hide();
        } else {
            this.scrollDownButton.show();
        }

        if (this.isScrolledToTop()) {
            this.scrollUpButton.hide();
        } else {
            this.scrollUpButton.show();
        }
    }

    resetScrollPosition() {
        this.imagePreviewContainer.getEl().setScrollTop(0);
    }

    private showScrollBar() {
        this.imagePreviewContainer.getHTMLElement().parentElement.style.marginRight = '-' + this.scrollBarWidth + 'px';
        this.imagePreviewContainer.getEl().setMarginRight('');
        this.imagePreviewContainer.getHTMLElement().style.overflowY = 'auto';
    }

    private removeScrollBarOnTimeout() {
        if (!!this.scrollBarRemoveTimeoutId) {
            window.clearTimeout(this.scrollBarRemoveTimeoutId);
        }

        this.scrollBarRemoveTimeoutId = window.setTimeout(() => {
            this.imagePreviewContainer.getHTMLElement().parentElement.style.marginRight = '';
            this.imagePreviewContainer.getEl().setMarginRight('-' + this.scrollBarWidth + 'px');
            this.imagePreviewContainer.getHTMLElement().style.overflowY = 'auto';
        }, 500);
    }
}

