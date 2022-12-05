import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {KeyBindings} from '@enonic/lib-admin-ui/ui/KeyBindings';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {MostPopularItemsBlock} from './MostPopularItemsBlock';
import {RecentItemsBlock} from './RecentItemsBlock';
import {NewContentDialogItemSelectedEvent} from './NewContentDialogItemSelectedEvent';
import {NewMediaUploadEvent} from './NewMediaUploadEvent';
import {NewContentEvent} from './NewContentEvent';
import {FilterableItemsList} from './FilterableItemsList';
import {AggregateContentTypesResult} from '../resource/AggregateContentTypesResult';
import {FileInput} from './FileInput';
import {Content} from '../content/Content';
import {NewContentUploader} from './NewContentUploader';
import {UploadItem} from '@enonic/lib-admin-ui/ui/uploader/UploadItem';
import {KeyHelper} from '@enonic/lib-admin-ui/ui/KeyHelper';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {UploadStartedEvent} from '@enonic/lib-admin-ui/ui/uploader/UploadStartedEvent';
import {DefaultModalDialogHeader, ModalDialog, ModalDialogConfig} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {DropzoneContainer} from '@enonic/lib-admin-ui/ui/uploader/UploaderEl';
import {SectionEl} from '@enonic/lib-admin-ui/dom/SectionEl';
import {AsideEl} from '@enonic/lib-admin-ui/dom/AsideEl';
import {FormEl} from '@enonic/lib-admin-ui/dom/FormEl';
import {KeyBinding} from '@enonic/lib-admin-ui/ui/KeyBinding';
import {PEl} from '@enonic/lib-admin-ui/dom/PEl';
import {ContentPath} from '../content/ContentPath';
import {ContentSummary} from '../content/ContentSummary';
import {ContentTypesHelper} from '../util/ContentTypesHelper';

export class NewContentDialog
    extends ModalDialog {

    private parentContent?: ContentSummary;

    private allowedContentTypes: string[];

    private fileInput: FileInput;

    private dropzoneContainer: DropzoneContainer;

    private newContentUploader: NewContentUploader;

    private allContentTypes: FilterableItemsList;

    private mostPopularContentTypes: MostPopularItemsBlock;

    private recentContentTypes: RecentItemsBlock;

    private contentTypes?: ContentTypeSummary[];

    private keyDownHandler: (event: KeyboardEvent) => void;

    private typeSelectedHandler?: (contentType: ContentTypeSummary, parentContent: ContentSummary) => void;

    protected header: NewContentDialogHeader;

    constructor() {
        super(<ModalDialogConfig>{
            title: i18n('dialog.new'),
            class: 'new-content-dialog'
        });
    }

    protected createHeader(): NewContentDialogHeader {
        return new NewContentDialogHeader(i18n('dialog.new'), '');
    }

    protected getHeader(): NewContentDialogHeader {
        return this.header;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.fileInput.hide();
            const mainSection = new SectionEl().setClass('column');
            this.appendChildToContentPanel(mainSection);

            this.mostPopularContentTypes.hide();

            const contentTypesListDiv = new DivEl('content-types-content');
            contentTypesListDiv.appendChild(this.allContentTypes);

            mainSection.appendChildren(<Element>this.fileInput, <Element>contentTypesListDiv);

            const sideBlock: AsideEl = new AsideEl();
            sideBlock.appendChild(this.mostPopularContentTypes);
            sideBlock.appendChild(this.recentContentTypes);
            this.appendChildToContentPanel(sideBlock);

            this.appendChild(this.dropzoneContainer);

            this.header.appendToTitle(this.newContentUploader);

            return rendered;
        });
    }

    protected initElements() {
        super.initElements();
        this.initContentTypesLists();
        this.initFileUploader();
        this.fileInput = new FileInput('large').setPlaceholder(i18n('dialog.new.searchTypes'));
    }

    protected postInitElements() {
        super.postInitElements();

        this.getButtonRow().getEl().setAttribute('data-drop', i18n('dialog.new.searchTypesOrDrop'));
    }

    protected initListeners() {
        super.initListeners();

        const selectedHandler: (event: NewContentDialogItemSelectedEvent) => void = this.handleTypeSelected.bind(this);
        this.allContentTypes.onSelected(selectedHandler);
        this.mostPopularContentTypes.getItemsList().onSelected(selectedHandler);
        this.recentContentTypes.getItemsList().onSelected(selectedHandler);
        this.initDragAndDropUploaderEvents();
        this.initKeyDownHandler();
        this.initFileInputEvents();
    }

    private initContentTypesLists() {
        this.allContentTypes = new FilterableItemsList();
        this.mostPopularContentTypes = new MostPopularItemsBlock();
        this.recentContentTypes = new RecentItemsBlock();
    }

    private initFileUploader() {
        this.dropzoneContainer = new DropzoneContainer(true);
        this.dropzoneContainer.hide();

        this.newContentUploader = new NewContentUploader()
            .setUploaderParams({parent: ContentPath.getRoot().toString()})
            .setDropzoneId(this.dropzoneContainer.getDropzone().getId());
    }

    private initFileInputEvents() {
        this.newContentUploader.onUploadStarted(this.closeAndFireEventFromMediaUpload.bind(this));
        this.newContentUploader.onUploadStarted((event: UploadStartedEvent<Content>) => {
            const names = event.getUploadItems().map((uploadItem: UploadItem<Content>) => {
                return uploadItem.getName();
            });
            this.fileInput.setText(names.join(', '));
        });

        this.fileInput.onValueChanged(() => {
            if (StringHelper.isEmpty(this.fileInput.getValue())) {
                this.mostPopularContentTypes.showIfNotEmpty();
            } else {
                this.mostPopularContentTypes.hide();
            }

            this.allContentTypes.filter(this.fileInput.getValue());
        });
    }

    private initKeyDownHandler() {
        this.keyDownHandler = (event: KeyboardEvent) => {
            const isLetterOrNumber: boolean = !event.altKey && !event.ctrlKey && KeyHelper.isAlphaNumeric(event);

            if (isLetterOrNumber) {
                this.fileInput.show();
                this.fileInput.focus();
                this.addClass('filter-visible');
                Body.get().unKeyDown(this.keyDownHandler);
            }
        };
    }

    // in order to toggle appropriate handlers during drag event
    // we catch drag enter on this element and trigger uploader to appear,

    setAllowedContentTypes(types: string[]): NewContentDialog {
        this.allowedContentTypes = types;
        return this;
    }

    private closeAndFireEventFromMediaUpload(event: UploadStartedEvent<Content>) {
        new NewMediaUploadEvent(event.getUploadItems(), this.parentContent).fire();
        this.close();
    }

    private handleTypeSelected(event: NewContentDialogItemSelectedEvent) {
        if (this.typeSelectedHandler) {
            this.typeSelectedHandler(event.getItem().getContentType(), this.parentContent);
        } else {
            new NewContentEvent(event.getItem().getContentType(), this.parentContent).fire();
        }

        this.close();
    }

    setParentContent(parent: ContentSummary): NewContentDialog {
        this.parentContent = parent;

        const params: { [key: string]: any } = {
            parent: parent ? parent.getPath().toString() : ContentPath.getRoot().toString()
        };

        this.newContentUploader.setUploaderParams(params);

        return this;
    }

    setTypeSelectedHandler(handler: (contentType: ContentTypeSummary, parentContent: ContentSummary) => void): NewContentDialog {
        this.typeSelectedHandler = handler;

        return this;
    }

    setContentTypes(types: ContentTypeSummary[]): NewContentDialog {
        this.contentTypes = types;
        return this;
    }

    // then catch drag leave on uploader's dropzone to get back to previous state
    private initDragAndDropUploaderEvents() {
        let dragOverEl;
        this.onDragEnter((event: DragEvent) => {
            if (this.newContentUploader.isEnabled()) {
                let target = <HTMLElement>event.target;

                if (!!dragOverEl || dragOverEl === this.getHTMLElement()) {
                    this.dropzoneContainer.show();
                }
                dragOverEl = target;
            }
        });

        this.newContentUploader.onDropzoneDragLeave(() => this.dropzoneContainer.hide());
        this.newContentUploader.onDropzoneDrop(() => this.dropzoneContainer.hide());
    }

    open() {
        super.open();
        this.bindKeys();
    }

    private bindKeys(): void {
        const keyBindings = [
            new KeyBinding('up', () => {
                FormEl.moveFocusToPrevFocusable(Element.fromHtmlElement(<HTMLElement>document.activeElement),
                    'input,li');
            }).setGlobal(true),
            new KeyBinding('down', () => {
                FormEl.moveFocusToNextFocusable(Element.fromHtmlElement(<HTMLElement>document.activeElement),
                    'input,li');
            }).setGlobal(true)];

        KeyBindings.get().bindKeys(keyBindings);
    }

    show() {
        this.updateDialogTitlePath();
        this.resetFileInputWithUploader();

        super.show();

        if (!this.fileInput.isVisible()) {
            Body.get().onKeyDown(this.keyDownHandler);
        }

        // CMS-3711: reload content types each time when dialog is show.
        // It is slow but newly create content types are displayed.
        this.updateContentTypesLists();
    }

    hide() {
        this.mostPopularContentTypes.hide();
        this.fileInput.hide();
        this.removeClass('filter-visible');
        this.clearAllItems();
        Body.get().unKeyDown(this.keyDownHandler);

        super.hide();
    }

    close() {
        this.fileInput.reset();
        this.newContentUploader.reset();
        this.typeSelectedHandler = null;
        this.contentTypes = null;

        if (this.isOpen()) {
            super.close();
        }
    }

    private updateContentTypesLists() {
        this.showLoadMask();

        Q.all([this.loadContentTypes(), ContentTypesHelper.getAggregatedTypesByContent(this.parentContent)])
            .spread((contentTypes: ContentTypeSummary[], aggregations: AggregateContentTypesResult) => this.updateLists(contentTypes,
                aggregations))
            .catch((DefaultErrorHandler.handle))
            .finally(() => this.handleTypesLoaded());
    }

    private loadContentTypes(): Q.Promise<ContentTypeSummary[]> {
        return this.contentTypes ? Q.resolve(this.contentTypes) : ContentTypesHelper.getAvailableContentTypes(this.parentContent);
    }

    private updateLists(contentTypes: ContentTypeSummary[], aggregations: AggregateContentTypesResult): void {
        this.allContentTypes.createItems(contentTypes);

        const popularItemsCount = this.mostPopularContentTypes.getItemsList().createItems(contentTypes, aggregations);
        this.mostPopularContentTypes.setVisible(popularItemsCount > 0);

        const recentItemsCount = this.recentContentTypes.getItemsList().createItems(this.allContentTypes.getItems());
        this.recentContentTypes.setVisible(recentItemsCount > 0);
    }

    private handleTypesLoaded(): void {
        this.fileInput.enable();
        this.toggleUploadersEnabled();
        this.hideLoadMask();
        this.mostPopularContentTypes.showIfNotEmpty();
        this.newContentUploader.focus();
    }

    private updateDialogTitlePath() {
        this.getHeader().setPath(this.parentContent?.getPath().toString() || '');
    }

    private clearAllItems() {
        this.mostPopularContentTypes.getItemsList().clearItems();
        this.allContentTypes.clearItems();
        this.recentContentTypes.getItemsList().clearItems();
    }

    private toggleUploadersEnabled() {
        const uploaderEnabled: boolean = !this.isTemplateFolderSelected();
        this.toggleClass('no-uploader-el', !uploaderEnabled);
        this.newContentUploader.setEnabled(uploaderEnabled);
    }

    private resetFileInputWithUploader() {
        this.addClass('no-uploader-el');
        this.fileInput.disable();
        this.fileInput.reset();
        this.newContentUploader.setEnabled(false);
        this.newContentUploader.reset();

        const hideUploader: boolean = this.isTemplateFolderSelected();
        this.newContentUploader.setVisible(!hideUploader);
    }

    private isTemplateFolderSelected(): boolean {
        return !!this.parentContent && this.parentContent.getType().isTemplateFolder();
    }
}

export class NewContentDialogHeader
    extends DefaultModalDialogHeader {

    private pathEl: PEl;

    private titleWrapper: DivEl;

    constructor(title: string, path: string) {
        super(title);

        this.titleWrapper = new DivEl('title-wrapper');
        this.appendChild(this.titleWrapper);
        this.titleWrapper.appendChild(this.getFirstChild());
        this.pathEl = new PEl('path');
        this.pathEl.getEl().setAttribute('data-desc', `${i18n('dialog.newContent.pathDescription')}:`);
        this.pathEl.setHtml(path);
        this.appendChild(this.pathEl);
    }

    setPath(path: string) {
        this.pathEl.setHtml(path).setVisible(!StringHelper.isBlank(path));
    }

    appendToTitle(element: Element) {
        this.titleWrapper.appendChild(element);
    }
}
