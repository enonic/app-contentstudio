import FormItem = api.ui.form.FormItem;
import Validators = api.ui.form.Validators;
import Action = api.ui.Action;
import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;
import ContentSummary = api.content.ContentSummary;
import eventInfo = CKEDITOR.eventInfo;
import ContentId = api.content.ContentId;
import AppHelper = api.util.AppHelper;
import ActionButton = api.ui.button.ActionButton;
import i18n = api.util.i18n;
import UploadedEvent = api.ui.uploader.UploadedEvent;
import UploadProgressEvent = api.ui.uploader.UploadProgressEvent;
import {Content} from '../../../../../content/Content';
import {XDataName} from '../../../../../content/XDataName';
import {OverrideNativeDialog} from './../OverrideNativeDialog';
import {HtmlAreaModalDialogConfig, ModalDialogFormItemBuilder} from './../ModalDialog';
import {ImageStyleSelector} from './ImageStyleSelector';
import {MediaTreeSelectorItem} from '../../../selector/media/MediaTreeSelectorItem';
import {ImageUploaderEl} from '../../../selector/image/ImageUploaderEl';
import {ImageContentComboBox} from '../../../selector/image/ImageContentComboBox';
import {ContentSelectedOptionsView} from '../../../selector/ContentComboBox';
import {MediaUploaderElOperation} from '../../../upload/MediaUploaderEl';
import {GetContentByIdRequest} from '../../../../../resource/GetContentByIdRequest';
import {StylesRequest} from '../../styles/StylesRequest';
import {Styles} from '../../styles/Styles';
import {Style} from '../../styles/Style';
import {HTMLAreaHelper} from '../../HTMLAreaHelper';
import {ImageUrlBuilder, ImageUrlParameters} from '../../../../../util/ImageUrlResolver';
import {StyleHelper} from '../../styles/StyleHelper';

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
    private imageUploaderEl: ImageUploaderEl;
    private imageElement: HTMLImageElement;
    private content: api.content.ContentSummary;
    private imageSelector: ImageContentComboBox;
    private progress: api.ui.ProgressBar;
    private error: api.dom.DivEl;
    private figure: api.dom.FigureEl;
    private imageToolbar: ImageDialogToolbar;
    private imagePreviewScrollHandler: ImagePreviewScrollHandler;
    private imageLoadMask: api.ui.mask.LoadMask;
    private dropzoneContainer: api.ui.uploader.DropzoneContainer;
    private imageSelectorFormItem: FormItem;
    private previewFrame: api.dom.IFrameEl;
    private scrollNavigationWrapperDiv: api.dom.DivEl;
    private editorWidth: number;

    static readonly defaultStyles = [StyleHelper.STYLE.ALIGNMENT.JUSTIFY];

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

        this.editorWidth = config.editor.element.$.clientWidth || config.editor.element.getParent().$.clientWidth;

        this.initLoader();

        if (this.getOriginalUrlElem().getValue()) {
            this.imageElement = (<any>this.getEditor().widgets).selected[0].parts.image.$;
            this.loadImage();
        }

        if (!Styles.getInstance()) {
            new StylesRequest(content.getId()).sendAndParse();
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

        new GetContentByIdRequest(new ContentId(imageId)).sendAndParse().then((imageContent: Content) => {
            this.imageSelector.setValue(imageContent.getId());
            this.previewImage(imageContent, false);
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

        const imageSelector = ImageContentComboBox.create().setMaximumOccurrences(1).setContent(
            this.content).setSelectedOptionsView(new ContentSelectedOptionsView()).build();

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

            this.previewImage(imageContent.getContent(), true);
            formItem.addClass('selected-item-preview');
            this.setAltTextFieldValue(imageContent.getDisplayName());
            this.fetchImageCaption(imageContent.getContentSummary()).then(value => this.setCaptionFieldValue(value)).catch(
                (reason: any) => api.DefaultErrorHandler.handle(reason)).done();
        });

        imageSelectorComboBox.onOptionDeselected(() => {
            formItem.removeClass('selected-item-preview');
            this.displayValidationErrors(false);
            this.removePreview();
            this.imageToolbar.unStylesChanged();
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
        this.imageUploaderEl = this.createImageUploader();

        imageSelectorContainer.appendChild(this.imageUploaderEl);
        this.initDragAndDropUploaderEvents();

        this.createImagePreviewContainer();

        this.scrollNavigationWrapperDiv = new api.dom.DivEl('preview-panel-scroll-navigation-wrapper');
        const scrollBarWrapperDiv = new api.dom.DivEl('preview-panel-scrollbar-wrapper');

        scrollBarWrapperDiv.appendChild(this.imagePreviewContainer);
        this.scrollNavigationWrapperDiv.appendChild(scrollBarWrapperDiv);

        wemjq(this.scrollNavigationWrapperDiv.getHTMLElement()).insertAfter(imageSelectorContainer.getHTMLElement());

        this.imagePreviewScrollHandler = new ImagePreviewScrollHandler(this.imagePreviewContainer);

        this.imageLoadMask = new api.ui.mask.LoadMask(this.imagePreviewContainer);

        this.imagePreviewContainer.appendChild(<api.dom.Element>this.imageLoadMask);

        api.ui.responsive.ResponsiveManager.onAvailableSizeChanged(this, () => {
            this.imagePreviewScrollHandler.toggleScrollButtons();
            this.imagePreviewScrollHandler.setMarginRight();
        });
    }

    private createPreviewFrame() {
        const appendStylesheet = (head, cssPath) => {
            const linkEl = new api.dom.LinkEl(cssPath, 'stylesheet');
            linkEl.getEl().setAttribute('type', 'text/css');
            head.appendChild(linkEl.getHTMLElement());
        };
        const injectCssIntoFrame = (head) => {
            if (Styles.getInstance()) {
                Styles.getCssPaths().forEach(cssPath => appendStylesheet(head, cssPath));
            }
        };

        this.figure = new api.dom.FigureEl();
        this.previewFrame = new api.dom.IFrameEl('preview-frame');

        this.imagePreviewContainer.insertChild(this.previewFrame, 0);

        const frameDocument = this.previewFrame.getHTMLElement()['contentDocument'];
        const frameBody = frameDocument.getElementsByTagName('body')[0];
        const frameBodyEl = new api.dom.Body(false, frameBody);
        frameBodyEl.setClass('preview-frame-body');

        frameBodyEl.appendChild(this.figure);

        injectCssIntoFrame(frameDocument.getElementsByTagName('head')[0]);
    }

    private updatePreview(styles: string) {
        this.applyStylingToPreview(styles);
        this.updateImageSrc(this.figure.getImage().getHTMLElement(), this.imagePreviewContainer.getEl().getWidth());
        this.figure.getImage().refresh();

        this.imagePreviewScrollHandler.resetScrollPosition();
    }

    private previewImage(imageContent: ContentSummary, isNewImage: boolean) {
        if (!this.previewFrame) {
            this.createPreviewFrame();
        }

        this.imageLoadMask.show();

        const image = this.createImgElForPreview(imageContent, isNewImage);
        if (isNewImage) {
            this.figure.setClass(ImageModalDialog.defaultStyles.join(' '));
        }

        const onImageFirstLoad = () => {
            this.imagePreviewContainer.removeClass('upload');

            this.imageToolbar = new ImageDialogToolbar(this.figure, this.imageLoadMask);
            this.imageToolbar.onStylesChanged((styles: string) => this.updatePreview(styles));

            wemjq(this.imageToolbar.getHTMLElement()).insertBefore(this.scrollNavigationWrapperDiv.getHTMLElement());

            image.unLoaded(onImageFirstLoad);
        };

        image.onLoaded(onImageFirstLoad);

        image.onLoaded(() => {
            this.previewFrame.getEl().setHeightPx(image.getEl().getHeight());
            this.imageLoadMask.hide();

            api.ui.responsive.ResponsiveManager.fireResizeEvent();
        });

        this.figure.setImage(image);

        this.hideUploadMasks();
        this.imageCaptionField.show();
        this.imageAltTextField.show();
        this.imageUploaderEl.hide();
    }


    private createImageBuilder(imageContent: ContentSummary, size?: number, style?: Style) {
        const imageUrlParams: ImageUrlParameters = {
            id: imageContent.getId(),
            useOriginal: false,
            timeStamp: imageContent.getModifiedTime(),
            scaleWidth: true
        };

        if (size) {
            imageUrlParams.size = size;
        }

        if (style) {
            imageUrlParams.useOriginal = StyleHelper.isOriginalImage(style.getName());
            imageUrlParams.aspectRatio = style.getAspectRatio();
            imageUrlParams.filter = style.getFilter();
        }

        return new ImageUrlBuilder(imageUrlParams);
    }

    private createImgElForPreview(imageContent: ContentSummary, isNewImage: boolean): api.dom.ImgEl {
        let imgSrcAttr = '';
        let imgDataSrcAttr = '';

        if (isNewImage) {

            const imageUrlBuilder = this.createImageBuilder(imageContent, this.imagePreviewContainer.getEl().getWidth());

            imgSrcAttr = imageUrlBuilder.buildForPreview();
            imgDataSrcAttr = imageUrlBuilder.buildForRender();
        }
        else {
            const imgEl = new api.dom.ElementHelper(this.imageElement);

            imgSrcAttr = imgEl.getAttribute('src');
            imgDataSrcAttr = imgEl.getAttribute('data-src');
        }

        const imageEl = new api.dom.ImgEl(imgSrcAttr);
        imageEl.getEl().setAttribute('data-src', imgDataSrcAttr);
/*
        const imageAlignment = this.getOriginalAlignmentElem().getValue();
        imageEl.getHTMLElement().style.textAlign = imageAlignment;
*/
        return imageEl;
    }

    private removePreview() {
        this.figure.removeChildren();
        this.previewFrame.getEl().setHeightPx(0);
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

    private createImageUploader(): ImageUploaderEl {
        const uploader = new ImageUploaderEl({
            operation: MediaUploaderElOperation.create,
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

        uploader.onUploadProgress((event: UploadProgressEvent<Content>) => {
            const item = event.getUploadItem();

            this.setProgress(item.getProgress());
        });

        uploader.onFileUploaded((event: UploadedEvent<Content>) => {
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
                this.updateEditorElements();
                this.close();
            }
        }));

        super.initializeActions();
    }

    private updateEditorElements() {
        const imageEl = (<any>this.ckeOriginalDialog).widget.parts.image;
        const figureEl = imageEl.getAscendant('figure');
        const figureCaptionEl = figureEl.findOne('figcaption');

        figureEl.setAttribute('class', this.figure.getClass());
        figureEl.removeAttribute('style');

        imageEl.removeAttribute('class', '');
        imageEl.removeAttribute('style', '');

        this.updateImageSrc(imageEl, this.editorWidth);

        figureCaptionEl.setText(this.getCaptionFieldValue());
    }

    private updateOriginalDialogInputValues(): void {
        const image = this.figure.getImage();
        const src: string = image.getEl().getAttribute('src');
        const altText: string = this.getAltTextFieldValue();
        const alignment: string = image.getHTMLElement().style.textAlign;
        const keepSize: boolean = image.getEl().getAttribute('data-src').indexOf('keepSize=true') > 0;

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
        return new GetContentByIdRequest(imageContent.getContentId()).sendAndParse()
            .then((content: Content) => {
                return this.getDescriptionFromImageContent(content) || content.getProperty('caption').getString() || '';
            });
    }

    private getDescriptionFromImageContent(imageContent: Content): string {
        const imageInfoMixin = new XDataName('media:imageInfo');
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

    private getImage(): api.dom.ImgEl {
        return this.figure.getImage();
    }

    private updateImageSrc(imageEl: HTMLElement, width: number) {
        const imageContent = this.imageSelector.getSelectedContent();
        const processingStyle = this.imageToolbar.getProcessingStyle();

        const imageUrlBuilder = this.createImageBuilder(imageContent, width, processingStyle);

        imageEl.setAttribute('src', imageUrlBuilder.buildForPreview());
        imageEl.setAttribute('data-src', imageUrlBuilder.buildForRender());
    }

    private applyStylingToPreview(classNames: string) {
        this.figure.setClass(classNames);
    }
}

export class ImageModalDialogConfig
    extends HtmlAreaModalDialogConfig {
    content: api.content.ContentSummary;
}

export class ImageDialogToolbar
    extends api.ui.toolbar.Toolbar {

    private previewEl: api.dom.FigureEl;

    private alignmentButtons: { [key: string]: ActionButton; } = {};

    private customWidthCheckbox: api.ui.Checkbox;

    private imageStyleSelector: ImageStyleSelector;

    private imageLoadMask: api.ui.mask.LoadMask;

    private stylesChangeListeners: { (styles: string): void }[] = [];

    constructor(previewEl: api.dom.FigureEl, imageLoadMask: api.ui.mask.LoadMask) {
        super('image-toolbar');

        this.previewEl = previewEl;
        this.imageLoadMask = imageLoadMask;

        this.createAlignmentButtons();
        super.addElement(this.imageStyleSelector = this.createImageStyleSelector());
        super.addElement(this.customWidthCheckbox = this.createCustomWidthCheckbox());
    }

    private createAlignmentButtons() {
        const alignmentButtonContainer = new api.dom.DivEl('alignment-container');
        alignmentButtonContainer.appendChildren(
            this.createAlignmentButton('icon-paragraph-justify', StyleHelper.STYLE.ALIGNMENT.JUSTIFY),
            this.createAlignmentButton('icon-paragraph-left', StyleHelper.STYLE.ALIGNMENT.LEFT),
            this.createAlignmentButton('icon-paragraph-center', StyleHelper.STYLE.ALIGNMENT.CENTER),
            this.createAlignmentButton('icon-paragraph-right', StyleHelper.STYLE.ALIGNMENT.RIGHT)
        );

        super.addElement(alignmentButtonContainer);
    }

    private createAlignmentButton(iconClass: string, styleClass: string): api.ui.button.ActionButton {
        const action: Action = new Action('');

        action.setIconClass(iconClass);

        const button = new api.ui.button.ActionButton(action);

        action.onExecuted(() => {
            this.resetActiveAlignmentButton();
            button.addClass('active');

            this.notifyStylesChanged();
        });

        this.alignmentButtons[styleClass] = button;

        if (this.previewEl.hasClass(styleClass)) {
            button.addClass('active');
        }

        return button;
    }

    private createCustomWidthCheckbox(): api.ui.Checkbox {
        const checkbox = api.ui.Checkbox.create().build();
        checkbox.addClass('custom-width-checkbox');
        checkbox.setLabel(i18n('dialog.image.customwidth'));

        /*
        Parse style attribute of the image preview and
        set checked to true if it has inline width

        checkbox.setChecked();
        */

        return checkbox;
    }

    private createImageStyleSelector(): ImageStyleSelector {
        const imageStyleSelector: ImageStyleSelector = new ImageStyleSelector();

        this.initSelectedStyle(imageStyleSelector);
        imageStyleSelector.onOptionSelected(() => this.notifyStylesChanged());

        return imageStyleSelector;
    }

    private initSelectedStyle(imageStyleSelector: ImageStyleSelector) {
        const imgSrc: string = this.previewEl.getEl().getAttribute('style');
        const stylesApplied = imgSrc ? imgSrc.split(' ') : null;

        if (!stylesApplied) {
            return;
        }

        const imageStyles = Styles.getForImageAsString();
        stylesApplied.forEach(style => {
            if (imageStyles.indexOf(style) > -1) {
                imageStyleSelector.setValue(style);

                return;
            }
        });
    }

    private getAlignmentStyleCls(): string {

        for (let alignment in this.alignmentButtons) {
            if (this.alignmentButtons[alignment].hasClass('active')) {
                return alignment.toString();
            }
        }

        return '';
    }

    private getProcessingStyleCls(): string {
        if (this.isProcessingStyleSelected()) {
            return this.imageStyleSelector.getSelectedOption().displayValue.getName();
        }

        return '';
    }

    private resetActiveAlignmentButton() {

        for (let alignment in this.alignmentButtons) {
            this.alignmentButtons[alignment].removeClass('active');
        }
    }

    private isProcessingStyleSelected(): boolean {
        return (!!this.imageStyleSelector &&
                !!this.imageStyleSelector.getSelectedOption() &&
                !this.imageStyleSelector.getSelectedOption().displayValue.isEmpty());
    }

    getProcessingStyle(): Style {
        if (this.isProcessingStyleSelected()) {
            return this.imageStyleSelector.getSelectedOption().displayValue.getStyle();
        }

        return;
    }

    private getStyleCls(): string {
        return [
            this.getAlignmentStyleCls(),
            this.getProcessingStyleCls()
        ].join(' ').trim();
    }

    onStylesChanged(listener: (styles: string) => void) {
        this.stylesChangeListeners.push(listener);
    }

    unStylesChanged() {
        this.stylesChangeListeners = [];
    }

    private notifyStylesChanged() {
        const styleClasses = this.getStyleCls();
        this.stylesChangeListeners.forEach(listener => listener(styleClasses));
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

