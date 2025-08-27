import Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {UploadedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadedEvent';
import {UploadProgressEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadProgressEvent';
import {InputEl} from '@enonic/lib-admin-ui/dom/InputEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {Content} from '../../../../../content/Content';
import {OverrideNativeDialog} from '../OverrideNativeDialog';
import {HtmlAreaModalDialogConfig, ModalDialogFormItemBuilder} from '../ModalDialog';
import {ImageStyleSelector} from './ImageStyleSelector';
import {MediaTreeSelectorItem} from '../../../selector/media/MediaTreeSelectorItem';
import {ImageUploaderEl} from '../../../selector/image/ImageUploaderEl';
import {ContentSelectedOptionsView} from '../../../selector/ContentComboBox';
import {MediaUploaderElOperation} from '../../../upload/MediaUploaderEl';
import {GetContentByIdRequest} from '../../../../../resource/GetContentByIdRequest';
import {StylesRequest} from '../../styles/StylesRequest';
import {Styles} from '../../styles/Styles';
import {Style} from '../../styles/Style';
import {HTMLAreaHelper} from '../../HTMLAreaHelper';
import {ImageUrlResolver} from '../../../../../util/ImageUrlResolver';
import {StyleHelper} from '../../styles/StyleHelper';
import {HtmlEditor} from '../../HtmlEditor';
import {ImageHelper} from '../../../../../util/ImageHelper';
import {ProgressBar} from '@enonic/lib-admin-ui/ui/ProgressBar';
import {FigureEl} from '@enonic/lib-admin-ui/dom/FigureEl';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {DropzoneContainer} from '@enonic/lib-admin-ui/ui/uploader/UploaderEl';
import {IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {Toolbar, ToolbarConfig} from '@enonic/lib-admin-ui/ui/toolbar/Toolbar';
import {Checkbox} from '@enonic/lib-admin-ui/ui/Checkbox';
import {ImgEl} from '@enonic/lib-admin-ui/dom/ImgEl';
import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {LinkEl} from '@enonic/lib-admin-ui/dom/LinkEl';
import {ContentSummary} from '../../../../../content/ContentSummary';
import {ContentId} from '../../../../../content/ContentId';
import {Project} from '../../../../../settings/data/project/Project';
import {ContentPath} from '../../../../../content/ContentPath';
import {ImageSelectorDropdown} from '../../../../selector/ImageSelectorDropdown';
import {ContentSelectorDropdownOptions} from '../../../../selector/ContentSelectorDropdown';
import {ImageContentListBox} from '../../../../selector/ImageContentListBox';
import {ImageOptionDataLoader, ImageOptionDataLoaderBuilder} from '../../../selector/image/ImageOptionDataLoader';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {RadioGroup} from '@enonic/lib-admin-ui/ui/RadioGroup';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {ValidationResult} from '@enonic/lib-admin-ui/ui/form/ValidationResult';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {TextInput} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import eventInfo = CKEDITOR.eventInfo;

enum ImageAccessibilityType {
    DECORATIVE = 'decorative',
    INFORMATIVE = 'informative',
}

export class ImageModalDialog
    extends OverrideNativeDialog {

    private imagePreviewContainer: DivEl;
    private imageCaptionField: FormItem;
    private imageAltTextInput: TextInput;
    private imageAltTextRadioFormItem: FormItem;
    private imageUploaderEl: ImageUploaderEl;
    private presetImageEl: HTMLElement;
    private presetImageId: string;
    private content?: ContentSummary;
    private imageSelector: ImageSelectorDropdown;
    private progress: ProgressBar;
    private error: DivEl;
    private figure: FigureEl;
    private imageToolbar: ImageDialogToolbar;
    private imageLoadMask: LoadMask;
    private dropzoneContainer: DropzoneContainer;
    private imageSelectorFormItem: FormItem;
    private previewFrame: IFrameEl;
    private editorWidth: number;
    protected secondaryForm: Form;
    declare protected config: ImageModalDialogConfig;

    static readonly defaultStyles: string[] = [StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS];

    constructor(config: eventInfo, content: ContentSummary, project?: Project) {
        super({
            editor: config.editor,
            dialog: config.data,
            content: content,
            project: project,
            editorWidth: config.editor.element.$.clientWidth || config.editor.element.getParent().$.clientWidth,
            title: i18n('dialog.image.title'),
            class: 'image-modal-dialog',
            confirmation: {
                yesCallback: () => this.getSubmitAction().execute(),
                noCallback: () => this.close(),
            }
        } as ImageModalDialogConfig);

        if (this.content) {
            StylesRequest.fetchStyles(content.getId());
        }
    }

    protected initElements() {
        super.initElements();

        this.secondaryForm = this.createSecondaryForm();
        this.secondaryForm.hide();
        this.editorWidth = this.config.editorWidth;
        this.content = this.config.content;
        this.figure = new FigureEl();
        this.imageUploaderEl = this.createImageUploader();
        this.createImagePreviewContainer();
        this.imageLoadMask = new LoadMask(this.imagePreviewContainer);
        this.initPresetImage();
        this.setSubmitAction(new Action(!!this.presetImageEl ? 'Update' : 'Insert'));
    }

    protected initListeners() {
        super.initListeners();

        this.onRendered(() => {
            this.imageUploaderEl.setParams({
                parent: this.content?.getContentId().toString() || ContentPath.getRoot().toString()
            });
        });

        this.submitAction.onExecuted(() => {
            this.displayValidationErrors(true);

            if (this.validate()) {
                this.updateOriginalDialogInputValues();
                this.ckeOriginalDialog.getButton('ok').click();
                this.updateEditorElements();
                this.close();
                this.config.editor.fire('change');
            }
        });

        this.imageSelectorFormItem.onRendered(() => {
            this.addUploaderAndPreviewControls();
            this.setElementToFocusOnShow(this.imageSelectorFormItem.getInput());
        });

        this.getImageAltTextRadioInput().onValueChanged(() => {
            this.imageAltTextRadioFormItem.validate(new ValidationResult(), true);
        });

        this.imageAltTextInput.onValueChanged(() => {
            this.imageAltTextRadioFormItem.validate(new ValidationResult(), true);
        });
    }

    protected validate(): boolean {
        return super.validate() && this.secondaryForm.validate(true).isValid();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.prependChildToFooter(this.secondaryForm);
            this.addAction(this.submitAction);
            this.addCancelButtonToBottom();

            return rendered;
        });
    }

    protected displayValidationErrors(value: boolean): void {
        super.displayValidationErrors(value);

        this.secondaryForm.toggleClass(FormView.VALIDATION_CLASS, value);
    }

    private initPresetImage() {

        const selectedElement = this.ckeOriginalDialog.getSelectedElement();

        if (!this.getOriginalUrlElem().getValue() || !selectedElement) {
            return;
        }

        const presetFigureEl = selectedElement.findOne('figure');

        this.presetImageEl = !!presetFigureEl ? presetFigureEl.findOne('img').$ : selectedElement.findOne('img').$;

        if (this.presetImageEl) {
            const presetStyles = !!presetFigureEl ? presetFigureEl.getAttribute('class') : '';
            if (presetFigureEl && presetFigureEl.hasAttribute('style')) {
                this.figure.getEl().setAttribute('style', presetFigureEl.getAttribute('style'));
            }
            this.presetImage(presetStyles);
        }
    }

    protected setDialogInputValues() {
        const caption: string = !!this.ckeOriginalDialog.getSelectedElement()
                                ? this.ckeOriginalDialog.getSelectedElement().getText()
                                : '';
        (this.imageCaptionField.getInput() as InputEl).setValue(caption);
    }

    private presetImage(presetStyles: string) {
        this.presetImageId = this.extractImageId();
        const altTextValue = this.getOriginalAltTextElem().getValue();

        if (StringHelper.isBlank(altTextValue)) {
            this.getImageAltTextRadioInput().setValue(ImageAccessibilityType.DECORATIVE);
        } else {
            this.imageAltTextInput.setValue(this.getOriginalAltTextElem().getValue());
            this.getImageAltTextRadioInput().setValue(ImageAccessibilityType.INFORMATIVE);
        }

        new GetContentByIdRequest(new ContentId(this.presetImageId)).setRequestProject(this.config.project).sendAndParse().then(
            (imageContent: Content) => {
                this.imageSelector.updateSelectedItems();
                this.imageSelector.show();
                this.previewImage(imageContent, presetStyles);
                this.imageSelectorFormItem.addClass('selected-item-preview');
            }).catch((reason) => {
            this.presetImageEl = null;
            this.imageSelector.show();
            DefaultErrorHandler.handle(reason);
        }).done();
    }

    private extractImageId(): string {
        const src: string = this.presetImageEl.getAttribute('data-src');

        if (!src) {
            throw new Error('Incorrectly formatted URL');
        }

        const imageId = HTMLAreaHelper.extractImageIdFromImgSrc(src);

        if (!imageId) {
            throw new Error('Incorrectly formatted URL');
        }

        return imageId;
    }

    protected getMainFormItems(): FormItem[] {
        this.imageSelectorFormItem = this.createImageSelector('imageId');

        if (this.presetImageEl) {
            this.imageSelector.hide();
            this.imageUploaderEl.hide();
        }

        return [
            this.imageSelectorFormItem
        ];
    }

    private createSecondaryForm(): Form {
        this.imageCaptionField = this.createFormItem(new ModalDialogFormItemBuilder('caption', i18n('dialog.image.formitem.caption')));
        this.imageAltTextRadioFormItem = this.createAltTextOptionRadio('altTextRadio');

        this.imageCaptionField.addClass('caption');
        this.imageAltTextRadioFormItem.addClass('image-accessibility');

        return this.createForm([
            this.imageCaptionField,
            this.imageAltTextRadioFormItem,
        ]);
    }

    private createImageSelector(id: string): FormItem {
        const loader = this.createImageLoader();
        const listBox = new ImageContentListBox({loader: loader});
        const dropdownOptions: ContentSelectorDropdownOptions = {
            loader: loader,
            maxSelected: 1,
            selectedOptionsView: new ContentSelectedOptionsView(),
            className: 'single-occurrence',
            getSelectedItems: () => this.presetImageId ? [this.presetImageId] : [],
        };

        const imageSelector = new ImageSelectorDropdown(listBox, dropdownOptions);

        const formItemBuilder = new ModalDialogFormItemBuilder(id, i18n('dialog.image.formitem.image')).setValidator(
            Validators.required).setInputEl(new ImageSelectorFormInputWrapper(imageSelector));

        const formItem = this.createFormItem(formItemBuilder);

        this.imageSelector = imageSelector;

        formItem.addClass('image-selector');

        this.imageSelector.onSelectionChanged((selectionChange: SelectionChange<MediaTreeSelectorItem>): void => {
            if (selectionChange.selected?.length > 0) {
                const imageSelectorItem: MediaTreeSelectorItem = selectionChange.selected[0];
                if (!imageSelectorItem.getContentId()) {
                    return;
                }

                this.previewImage(imageSelectorItem.getContent());
                formItem.addClass('selected-item-preview');

                new GetContentByIdRequest(imageSelectorItem.getContent().getContentId()).setRequestProject(
                    this.config.project).sendAndParse().then((content: Content) => {
                        const altTextValue = ImageHelper.getImageAltText(content);

                    if (!StringHelper.isBlank(altTextValue)) {
                        this.imageAltTextInput.setValue(altTextValue, true);
                    }

                    this.setCaptionFieldValue(ImageHelper.getImageCaption(content));
                }).catch(DefaultErrorHandler.handle).done();
            }

            if (selectionChange.deselected?.length > 0) {
                formItem.removeClass('selected-item-preview');
                this.displayValidationErrors(false);
                this.removePreview();
                this.imageToolbar.unStylesChanged();
                this.imageToolbar.unPreviewSizeChanged();
                this.imageToolbar.remove();
                this.imageAltTextInput.setValue('');
                this.secondaryForm.hide();
                this.getImageAltTextRadioInput().setValue('');
                this.imageUploaderEl.show();
                this.figure.getEl().removeAttribute('style');
                ResponsiveManager.fireResizeEvent();
            }
        });

        return formItem;
    }

    private createImageLoader(): ImageOptionDataLoader {
        return new ImageOptionDataLoaderBuilder()
            .setContent(this.content)
            .setProject(this.config.project)
            .setAppendLoadResults(false)
            .build();
    }

    private createAltTextOptionRadio(id: string): FormItem {
        const imageAccessibilityRadio = new RadioGroup('radio');
        imageAccessibilityRadio.addClass('image-accessibility-radio');

        imageAccessibilityRadio.addOption(ImageAccessibilityType.DECORATIVE, i18n('dialog.image.accessibility.decorative'));
        imageAccessibilityRadio.addOption(ImageAccessibilityType.INFORMATIVE, i18n('dialog.image.accessibility.informative'));

        imageAccessibilityRadio.onValueChanged((event: ValueChangedEvent) => {
            this.imageAltTextInput.setEnabled(event.getNewValue() === ImageAccessibilityType.INFORMATIVE.toString());
        });

        this.imageAltTextInput =
            new TextInput('alt-text').setPlaceholder(i18n('dialog.image.accessibility.informative.placeholder')) as TextInput;
        this.imageAltTextInput.setEnabled(false);

        imageAccessibilityRadio.appendChild(this.imageAltTextInput);

        const formItemBuilder =
            new ModalDialogFormItemBuilder(id, i18n('dialog.image.accessibility.title'))
                .setInputEl(imageAccessibilityRadio)
                .setValidator(this.validateImageAccessibility.bind(this));

        const imageAltTextRadioFormItem = this.createFormItem(formItemBuilder);
        imageAltTextRadioFormItem.getLabel().addClass('required');

        return imageAltTextRadioFormItem;
    }

    private validateImageAccessibility(input: RadioGroup): string {
        const value = input.getValue();

        if (StringHelper.isBlank(value)) {
            return i18n('field.value.required');
        }

        if (value === ImageAccessibilityType.INFORMATIVE.toString()) {
            const altText = this.imageAltTextInput.getValue();

            if (StringHelper.isBlank(altText)) {
                return i18n('dialog.image.accessibility.alttext.empty');
            }
        }

        return undefined;
    }

    private addUploaderAndPreviewControls() {
        const imageSelectorContainer = this.imageSelectorFormItem.getInput().getParentElement();
        imageSelectorContainer.appendChild(this.imageUploaderEl);
        this.initDragAndDropUploaderEvents();

        this.imagePreviewContainer.appendChild(this.imageLoadMask as Element);

        this.imagePreviewContainer.insertAfterEl(imageSelectorContainer);
    }

    private createPreviewFrame() {
        const appendStylesheet = (head, cssPath) => {
            const linkEl = new LinkEl(cssPath);
            head.appendChild(linkEl.getHTMLElement());
        };
        const injectCssIntoFrame = (head) => {
            Styles.getCssPaths(this.content?.getId()).forEach(cssPath => appendStylesheet(head, cssPath));
        };

        this.previewFrame = new IFrameEl('preview-frame');

        this.imagePreviewContainer.insertChild(this.previewFrame, 0);

        this.previewFrame.onRendered(() => {

            setTimeout(() => {

                const frameDocument = this.previewFrame.getHTMLElement()['contentDocument'];
                const frameBody = frameDocument.getElementsByTagName('body')[0];
                const frameBodyEl = new Body(false, frameBody);
                frameBodyEl.setClass('preview-frame-body');

                frameBodyEl.appendChild(this.figure);

                injectCssIntoFrame(frameDocument.getElementsByTagName('head')[0]);
            }, 50);
        });

    }

    private updatePreview(styles: string) {
        this.applyStylingToPreview(styles);
        this.updateImageSrc(this.figure.getImage().getHTMLElement(), this.imagePreviewContainer.getEl().getWidth());
        this.figure.getImage().refresh();
    }

    private adjustPreviewFrameHeight() {
        const imageHeight = this.figure.getImage().getEl().getHeight();
        if (imageHeight === 0) {
            return;
        }
        this.previewFrame.getEl().setHeightPx(imageHeight);
    }

    private previewImage(imageContent: ContentSummary, presetStyles?: string) {
        if (!this.previewFrame) {
            this.createPreviewFrame();
        }

        this.figure.setClass(presetStyles || ImageModalDialog.defaultStyles.join(' ').trim());

        if (!StyleHelper.getAlignmentStyles().some(style => this.figure.hasClass(style))) {
            this.figure.setClass(StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS);
        }

        const onImageFirstLoad = () => {
            this.imagePreviewContainer.removeClass('upload');

            this.imageToolbar = new ImageDialogToolbar(this.figure, this.content?.getId());
            this.imageToolbar.onStylesChanged((styles: string) => this.updatePreview(styles));
            this.imageToolbar.onPreviewSizeChanged(() => setTimeout(() => this.adjustPreviewFrameHeight(), 100));

            this.imageToolbar.insertBeforeEl(this.imagePreviewContainer);

            image.unLoaded(onImageFirstLoad);
        };

        const image = this.createImgElForPreview(imageContent);
        image.onLoaded(onImageFirstLoad);

        image.onLoaded(() => {
            this.adjustPreviewFrameHeight();
            this.imageLoadMask.hide();

            ResponsiveManager.fireResizeEvent();
        });

        this.figure.setImage(image);

        this.hideUploadMasks();
        this.secondaryForm.show();
        this.imageUploaderEl.hide();

        if (!image.isLoaded()) {
            this.imageLoadMask.show();
        }
    }


    private createImageUrlResolver(imageContent: ContentSummary, size?: number, style?: Style): ImageUrlResolver {
        const isOriginalImage = style ? StyleHelper.isOriginalImage(style.getName()) : false;
        const imgUrlResolver = new ImageUrlResolver(null, this.config.project)
            .setContentId(imageContent.getContentId())
            .setTimestamp(imageContent.getModifiedTime())
            .setScaleWidth(true);

        if (size && !isOriginalImage) {
            imgUrlResolver.setSize(size);
        }

        if (style) {

            if (isOriginalImage) {
                imgUrlResolver.disableProcessing();
            }

            imgUrlResolver
                .setAspectRatio(style.getAspectRatio())
                .setFilter(style.getFilter());
        }

        return imgUrlResolver;
    }

    private getImagePreviewSrc(): string {
        let imgSrcAttr = this.presetImageEl.getAttribute('src');

        const src = imgSrcAttr.replace(/&amp;/g, '&');
        const params = UriHelper.decodeUrlParams(src);
        if (params.size) {
            const plainUrl = UriHelper.trimUrlParams(src);
            params.size = this.imagePreviewContainer.getEl().getWidth().toString();
            imgSrcAttr = UriHelper.appendUrlParams(plainUrl, params, false);
        }

        return imgSrcAttr;
    }

    private createImgElForPreview(imageContent: ContentSummary): ImgEl {
        let imgSrcAttr = '';
        let imgDataSrcAttr = '';

        if (this.presetImageEl) {
            imgSrcAttr = this.getImagePreviewSrc();
            imgDataSrcAttr = this.presetImageEl.getAttribute('data-src');
        } else {
            const imageUrlBuilder = this.createImageUrlResolver(imageContent, this.imagePreviewContainer.getEl().getWidth());
            imgSrcAttr = imageUrlBuilder.resolveForPreview();
            imgDataSrcAttr = imageUrlBuilder.resolveForRender();
        }

        const imageEl = new ImgEl(imgSrcAttr);
        imageEl.getEl().setAttribute('data-src', imgDataSrcAttr);

        return imageEl;
    }

    private removePreview() {
        this.figure.removeChildren();
        this.previewFrame.getEl().setHeightPx(0);
        this.presetImageEl = null;
        this.presetImageId = null;
    }

    private createImagePreviewContainer() {
        this.imagePreviewContainer = new DivEl('content-item-preview-panel');

        this.progress = new ProgressBar();
        this.error = new DivEl('error');

        this.imagePreviewContainer.appendChildren(this.progress, this.error);
    }

    private createImageUploader(): ImageUploaderEl {
        const uploader: ImageUploaderEl = new ImageUploaderEl({
            operation: MediaUploaderElOperation.create,
            name: 'image-selector-upload-dialog',
            showResult: false,
            allowMultiSelection: false,
            deferred: true,
            showCancel: false,
            selfIsDropzone: false,
            project: this.config.project
        });

        this.dropzoneContainer = new DropzoneContainer(true);
        this.dropzoneContainer.hide();
        this.appendChild(this.dropzoneContainer);

        uploader.addDropzone(this.dropzoneContainer.getDropzone().getId());

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

            this.imageSelector.select(new MediaTreeSelectorItem(createdContent));
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
                const target = event.target as HTMLElement;

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

    private updateEditorElements() {
        const imageEl: CKEDITOR.dom.element = this.ckeOriginalDialog['widget'].parts.image;
        const figureEl: CKEDITOR.dom.element = imageEl.getAscendant('figure') as CKEDITOR.dom.element;

        figureEl.setAttribute('class', `${this.figure.getClass()}`);
        figureEl.removeAttribute('style');

        if (this.figure.getEl().hasAttribute('style') && !!this.figure.getEl().getAttribute('style')) {
            figureEl.setAttribute('style', this.figure.getEl().getAttribute('style'));
        }

        imageEl.removeAttribute('class');
        imageEl.setStyle('width', '100%');

        this.updateImageSrc(imageEl.$, this.editorWidth);

        figureEl.findOne('figcaption')?.setText(this.getCaptionFieldValue());
    }

    private updateOriginalDialogInputValues(): void {
        const image = this.figure.getImage();
        const src: string = image.getEl().getAttribute('src');
        const altText: string = this.getAltTextFieldValue();
        const alignment: string = this.imageToolbar.getAlignment();
        const noCaption = StringHelper.isBlank(this.getCaptionFieldValue());

        this.getOriginalUrlElem().setValue(src, true);
        this.getOriginalAltTextElem().setValue(altText, false);
        this.getOriginalHasCaptionElem().setValue(!noCaption, false);
        this.getOriginalAlignmentElem().setValue(alignment, false);
    }

    private setCaptionFieldValue(value: string) {
        (this.imageCaptionField.getInput() as InputEl).setValue(value);
    }

    private getCaptionFieldValue() {
        return (this.imageCaptionField.getInput() as InputEl).getValue().trim();
    }

    private getAltTextFieldValue() {
        return this.getImageAltTextRadioInput().getValue() === ImageAccessibilityType.INFORMATIVE.toString() ? this.imageAltTextInput.getValue() : '';
    }

    private getImageAltTextRadioInput(): RadioGroup {
        return this.imageAltTextRadioFormItem.getInput() as RadioGroup;
    }

    private getOriginalUrlElem(): CKEDITOR.ui.dialog.uiElement {
        return (this.getElemFromOriginalDialog('info', undefined) as CKEDITOR.ui.dialog.hbox).getChild(0);
    }

    private getOriginalAltTextElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'alt');
    }

    private getOriginalHasCaptionElem(): CKEDITOR.ui.dialog.checkbox {
        return this.getElemFromOriginalDialog('info', 'hasCaption') as CKEDITOR.ui.dialog.checkbox;
    }

    private getOriginalAlignmentElem(): CKEDITOR.ui.dialog.uiElement {
        return (this.getElemFromOriginalDialog('info', 'alignment') as CKEDITOR.ui.dialog.hbox).getChild(0);
    }

    isDirty(): boolean {
        return AppHelper.isDirty(this);
    }

    private updateImageSrc(imageEl: HTMLElement, width: number) {
        const imageContent = this.imageSelector.getSelectedOptions()[0].getOption().getDisplayValue().getContent();
        const processingStyle = this.imageToolbar.getProcessingStyle();

        const imageUrlBuilder = this.createImageUrlResolver(imageContent, width, processingStyle);

        imageEl.setAttribute('src', imageUrlBuilder.resolveForPreview());
        imageEl.setAttribute('data-src', imageUrlBuilder.resolveForRender(processingStyle ? processingStyle.getName() : ''));
    }

    private applyStylingToPreview(classNames: string) {
        this.figure.setClass('captioned ' + classNames);
        const ckeFigure: CKEDITOR.dom.element = new CKEDITOR.dom.element(this.figure.getHTMLElement());
        HtmlEditor.updateFigureInlineStyle(ckeFigure);
        HtmlEditor.sortFigureClasses(ckeFigure);
    }
}

export interface ImageModalDialogConfig
    extends HtmlAreaModalDialogConfig {
    content?: ContentSummary;
    project?: Project;
    editorWidth: number;
}

export class ImageDialogToolbar
    extends Toolbar<ToolbarConfig> {

    private contentId?: string;

    private previewEl: FigureEl;

    private alignmentButtons: Record<string, ActionButton> = {};

    private customWidthCheckbox: Checkbox;

    private imageStyleSelector: ImageStyleSelector;

    private customWidthRangeInput: InputEl;

    private rangeInputContainer: DivEl;

    private widthBoard: SpanEl;

    private stylesChangeListeners: ((styles: string) => void)[] = [];
    private previewSizeChangeListeners: (() => void)[] = [];

    constructor(previewEl: FigureEl, contentId: string) {
        super({className: 'image-toolbar'});

        this.previewEl = previewEl;
        this.contentId = contentId;

        this.createElements();
    }

    private createElements() {
        const alignmentButtonContainer = this.createAlignmentButtons();
        super.addContainer(alignmentButtonContainer, alignmentButtonContainer.getChildren());
        super.addElement(this.imageStyleSelector = this.createImageStyleSelector());
        super.addElement(this.customWidthCheckbox = this.createCustomWidthCheckbox());
        super.addElement(this.createCustomWidthRangeInput());
    }

    private createAlignmentButtons(): DivEl {
        const alignmentButtonContainer = new DivEl('alignment-container');

        alignmentButtonContainer.appendChildren(
            this.createAlignmentButton('icon-paragraph-justify', StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS),
            this.createAlignmentButton('icon-paragraph-left', StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS),
            this.createAlignmentButton('icon-paragraph-center', StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS),
            this.createAlignmentButton('icon-paragraph-right', StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS)
        );

        return alignmentButtonContainer;
    }

    private createAlignmentButton(iconClass: string, styleClass: string): ActionButton {
        const action: Action = new Action();

        action.setIconClass(iconClass);

        const button = new ActionButton(action);

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

    private createCustomWidthCheckbox(): Checkbox {
        const isChecked: boolean = this.previewEl.hasClass(StyleHelper.STYLE.WIDTH.CUSTOM);
        const checkbox = Checkbox.create().setChecked(isChecked).build();

        checkbox.addClass('custom-width-checkbox');
        checkbox.setLabel(i18n('dialog.image.customwidth'));

        if (StyleHelper.isOriginalImage(this.getProcessingStyleCls())) {
            checkbox.setEnabled(false);
        }

        checkbox.onChange(() => {
            if (checkbox.isChecked()) {
                this.previewEl.addClass(StyleHelper.STYLE.WIDTH.CUSTOM);
                this.rangeInputContainer.show();
                const width: string = this.getAlignmentWidth();
                this.customWidthRangeInput.getHTMLElement()['value'] = width;
                this.widthBoard.setHtml(`${width}%`);
                this.updatePreviewCustomWidth(width);
            } else {
                this.previewEl.removeClass(StyleHelper.STYLE.WIDTH.CUSTOM);
                this.previewEl.getEl().removeAttribute('style');
                this.rangeInputContainer.hide();
            }
            this.notifyPreviewSizeChanged();
        });

        return checkbox;
    }

    private getAlignmentWidth(): string {
        if (this.previewEl.hasClass(StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS)) {
            return StyleHelper.STYLE.ALIGNMENT.LEFT.WIDTH;
        }

        if (this.previewEl.hasClass(StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS)) {
            return StyleHelper.STYLE.ALIGNMENT.RIGHT.WIDTH;
        }

        if (this.previewEl.hasClass(StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS)) {
            return StyleHelper.STYLE.ALIGNMENT.CENTER.WIDTH;
        }

        return '100';
    }

    private createCustomWidthRangeInput(): DivEl {
        this.customWidthRangeInput = new InputEl('custom-width-range', 'range');
        this.widthBoard = new SpanEl('custom-width-board');
        this.rangeInputContainer = new DivEl('custom-width-range-container');

        this.customWidthRangeInput.getEl().setAttribute('min', '0');
        this.customWidthRangeInput.getEl().setAttribute('max', '100');
        this.customWidthRangeInput.getEl().setAttribute('step', '1');

        if (this.previewEl.hasClass(StyleHelper.STYLE.WIDTH.CUSTOM)) {
            const value: string = this.previewEl.getHTMLElement().style.width;
            this.customWidthRangeInput.getHTMLElement()['value'] = value.replace('%', '');
            this.widthBoard.setHtml(value);
        } else {
            this.rangeInputContainer.hide();
        }

        this.customWidthRangeInput.onChange((event: UIEvent) => {
            const value: string = event.srcElement['value'];
            this.updatePreviewCustomWidth(value);
            this.widthBoard.setHtml(`${value}%`);
            this.notifyPreviewSizeChanged();
        });

        this.customWidthRangeInput.onInput((event: UIEvent) => {
            const value: string = event.srcElement['value'];
            this.updatePreviewCustomWidth(value);
            this.widthBoard.setHtml(`${value}%`);
        });

        this.rangeInputContainer.appendChild(this.customWidthRangeInput);
        this.rangeInputContainer.appendChild(this.widthBoard);

        if (!this.previewEl.hasClass(StyleHelper.STYLE.WIDTH.CUSTOM)) {
            this.rangeInputContainer.hide();
        }

        return this.rangeInputContainer;
    }

    private updatePreviewCustomWidth(value: string) {
        this.previewEl.getEl().setWidth(`${value}%`);
    }

    private createImageStyleSelector(): ImageStyleSelector {
        const imageStyleSelector: ImageStyleSelector = new ImageStyleSelector(this.contentId);

        this.initSelectedStyle(imageStyleSelector);
        imageStyleSelector.onSelectionChanged(() => {
            if (StyleHelper.isOriginalImage(this.getProcessingStyleCls())) {
                this.customWidthCheckbox.setChecked(false).setEnabled(false);
                this.rangeInputContainer.hide();
                this.previewEl.getEl().removeAttribute('style');
            } else {
                this.customWidthCheckbox.setEnabled(true);
            }

            this.notifyStylesChanged();
        });

        return imageStyleSelector;
    }

    private initSelectedStyle(imageStyleSelector: ImageStyleSelector) {
        const previewStyles: string = this.previewEl.getClass();
        const stylesApplied = previewStyles ? previewStyles.trim().split(' ') : null;

        if (!stylesApplied) {
            return;
        }

        const imageStyles = Styles.getForImageAsString(this.contentId);
        stylesApplied.forEach(style => {
            if (imageStyles.indexOf(style) > -1) {
                imageStyleSelector.selectStyleByName(style);

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

    getAlignment(): string {

        for (let alignment in this.alignmentButtons) {
            if (this.alignmentButtons[alignment].hasClass('active')) {
                return alignment.toString().replace('editor-align-', '');
            }
        }

        return 'justify';
    }

    private getProcessingStyleCls(): string {
        if (this.isProcessingStyleSelected()) {
            return this.imageStyleSelector.getSelectedStyle().getName();
        }

        return '';
    }

    private resetActiveAlignmentButton() {

        for (let alignment in this.alignmentButtons) {
            this.alignmentButtons[alignment].removeClass('active');
        }
    }

    private isProcessingStyleSelected(): boolean {
        const selectedStyle = this.imageStyleSelector.getSelectedStyle();
        return selectedStyle && !selectedStyle.isEmpty();
    }

    getProcessingStyle(): Style {
        if (this.isProcessingStyleSelected()) {
            return this.imageStyleSelector.getSelectedStyle();
        }

        return;
    }

    private getStyleCls(): string {
        const classes: string[] = [];

        const alignStyleCls: string = this.getAlignmentStyleCls();
        const processingStyleCls: string = this.getProcessingStyleCls();

        if (alignStyleCls) {
            classes.push(alignStyleCls);
        }

        if (processingStyleCls) {
            classes.push(processingStyleCls);
        }

        if (this.customWidthCheckbox.isChecked()) {
            classes.push(StyleHelper.STYLE.WIDTH.CUSTOM);
        }

        return classes.join(' ').trim();
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

    onPreviewSizeChanged(listener: () => void) {
        this.previewSizeChangeListeners.push(listener);
    }

    unPreviewSizeChanged() {
        this.previewSizeChangeListeners = [];
    }

    private notifyPreviewSizeChanged() {
        this.previewSizeChangeListeners.forEach(listener => listener());
    }
}

class ImageSelectorFormInputWrapper
    extends FormInputEl {

    private readonly imageSelector: ImageSelectorDropdown;

    constructor(imageSelector: ImageSelectorDropdown) {
        super('div', 'content-selector-wrapper');

        this.imageSelector = imageSelector;
        this.appendChild(this.imageSelector);
    }


    getValue(): string {
        return this.imageSelector.getSelectedOptions()[0]?.getOption().getDisplayValue()?.getContent()?.getId() || '';
    }
}
