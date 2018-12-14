import {MostPopularItemsBlock} from './MostPopularItemsBlock';
import {RecentItemsBlock} from './RecentItemsBlock';
import {NewContentDialogItemSelectedEvent} from './NewContentDialogItemSelectedEvent';
import {NewMediaUploadEvent} from './NewMediaUploadEvent';
import {NewContentEvent} from './NewContentEvent';
import {FilterableItemsList} from './FilterableItemsList';
import {AggregateContentTypesResult} from '../resource/AggregateContentTypesResult';
import {AggregateContentTypesByPathRequest} from '../resource/AggregateContentTypesByPathRequest';
import {FileInput} from './FileInput';
import {GetNearestSiteRequest} from '../resource/GetNearestSiteRequest';
import {Content} from '../content/Content';
import {Site} from '../content/Site';
import {GetAllContentTypesRequest} from '../resource/GetAllContentTypesRequest';
import {NewContentUploader} from './NewContentUploader';
import ContentPath = api.content.ContentPath;
import LoadMask = api.ui.mask.LoadMask;
import IsAuthenticatedRequest = api.security.auth.IsAuthenticatedRequest;
import LoginResult = api.security.auth.LoginResult;
import UploadItem = api.ui.uploader.UploadItem;
import KeyHelper = api.ui.KeyHelper;
import i18n = api.util.i18n;
import ContentTypeSummaries = api.schema.content.ContentTypeSummaries;
import ContentTypeSummary = api.schema.content.ContentTypeSummary;
import UploadStartedEvent = api.ui.uploader.UploadStartedEvent;

export class NewContentDialog extends api.ui.dialog.ModalDialog {

    private parentContent: Content;

    private fileInput: FileInput;

    private dropzoneContainer: api.ui.uploader.DropzoneContainer;

    private newContentUploader: NewContentUploader;

    private allContentTypes: FilterableItemsList;

    private mostPopularContentTypes: MostPopularItemsBlock;

    private recentContentTypes: RecentItemsBlock;

    private keyDownHandler: (event: KeyboardEvent) => void;

    protected loadMask: LoadMask;

    protected header: NewContentDialogHeader;

    constructor() {
        super(<api.ui.dialog.ModalDialogConfig>{
            title: i18n('dialog.new')
        });

        this.addClass('new-content-dialog');

        this.initElements();
    }

    protected createHeader(): NewContentDialogHeader {
        return new NewContentDialogHeader(i18n('dialog.new'), '');
    }

    protected getHeader(): NewContentDialogHeader {
        return this.header;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            const mainSection = new api.dom.SectionEl().setClass('column');
            this.appendChildToContentPanel(mainSection);

            this.mostPopularContentTypes.hide();

            const contentTypesListDiv = new api.dom.DivEl('content-types-content');
            contentTypesListDiv.appendChild(this.allContentTypes);

            mainSection.appendChildren(<api.dom.Element>this.fileInput, <api.dom.Element>contentTypesListDiv);

            const sideBlock: api.dom.AsideEl = new api.dom.AsideEl();
            sideBlock.appendChild(this.mostPopularContentTypes);
            sideBlock.appendChild(this.recentContentTypes);
            this.appendChildToContentPanel(sideBlock);

            this.appendChild(this.dropzoneContainer);

            this.header.insertChild(this.newContentUploader, 1);

            return rendered;
        });
    }

    private initElements() {
        this.initContentTypesLists();
        this.initFileUploader();
        this.initFileInput();
        this.initDragAndDropUploaderEvents();
        this.initLoadMask();
        this.initButtonRow();
        this.initKeyDownHandler();
    }

    private initContentTypesLists() {
        this.allContentTypes = new FilterableItemsList();
        this.mostPopularContentTypes = new MostPopularItemsBlock();
        this.recentContentTypes = new RecentItemsBlock();

        this.allContentTypes.onSelected(this.closeAndFireEventFromContentType.bind(this));
        this.mostPopularContentTypes.getItemsList().onSelected(this.closeAndFireEventFromContentType.bind(this));
        this.recentContentTypes.getItemsList().onSelected(this.closeAndFireEventFromContentType.bind(this));
    }

    private initFileUploader() {
        this.dropzoneContainer = new api.ui.uploader.DropzoneContainer(true);
        this.dropzoneContainer.hide();

        this.newContentUploader = new NewContentUploader()
            .setUploaderParams({parent: ContentPath.ROOT.toString()})
            .setDropzoneId(this.dropzoneContainer.getDropzone().getId());
    }

    private initFileInput() {
        this.fileInput = new FileInput('large').setPlaceholder(i18n('dialog.new.searchTypes'));
        this.initFileInputEvents();
        this.fileInput.hide();
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
            if (api.util.StringHelper.isEmpty(this.fileInput.getValue())) {
                this.mostPopularContentTypes.showIfNotEmpty();
            } else {
                this.mostPopularContentTypes.hide();
            }

            this.allContentTypes.filter(this.fileInput.getValue());
        });
    }

    private initLoadMask() {
        this.loadMask = new LoadMask(this);
    }

    private initButtonRow() {
        this.getButtonRow().getEl().setAttribute('data-drop', i18n('drop.file.long'));
    }

    private initKeyDownHandler() {
        this.keyDownHandler = (event: KeyboardEvent) => {
            const isLetterOrNumber: boolean = KeyHelper.isNumber(event) || (event.keyCode >= 65 && event.keyCode <= 90);

            if (isLetterOrNumber) {
                this.fileInput.show();
                this.fileInput.focus();
                this.addClass('filter-visible');
                api.dom.Body.get().unKeyDown(this.keyDownHandler);
            }
        };
    }

    // in order to toggle appropriate handlers during drag event
    // we catch drag enter on this element and trigger uploader to appear,
    // then catch drag leave on uploader's dropzone to get back to previous state
    private initDragAndDropUploaderEvents() {
        let dragOverEl;
        this.onDragEnter((event: DragEvent) => {
            if (this.newContentUploader.isEnabled()) {
                let target = <HTMLElement> event.target;

                if (!!dragOverEl || dragOverEl === this.getHTMLElement()) {
                    this.dropzoneContainer.show();
                }
                dragOverEl = target;
            }
        });

        this.newContentUploader.onDropzoneDragLeave(() => this.dropzoneContainer.hide());
        this.newContentUploader.onDropzoneDrop(() => this.dropzoneContainer.hide());
    }

    private closeAndFireEventFromMediaUpload(event: UploadStartedEvent<Content>) {
        const handler = (e: api.dom.ElementHiddenEvent) => {
            new NewMediaUploadEvent(event.getUploadItems(), this.parentContent).fire();
            this.unHidden(handler);
        };
        this.onHidden(handler);

        this.close();
    }

    private closeAndFireEventFromContentType(event: NewContentDialogItemSelectedEvent) {
        const handler = (e: api.dom.ElementHiddenEvent) => {
            new NewContentEvent(event.getItem().getContentType(), this.parentContent).fire();
            this.unHidden(handler);
        };
        this.onHidden(handler);

        this.close();
    }

    setParentContent(parent: Content) {
        this.parentContent = parent;
        this.allContentTypes.setParentContent(parent);

        const params: { [key: string]: any } = {
            parent: parent ? parent.getPath().toString() : api.content.ContentPath.ROOT.toString()
        };

        this.newContentUploader.setUploaderParams(params);
    }

    open() {
        super.open();
        const keyBindings = [
            new api.ui.KeyBinding('up', () => {
                api.dom.FormEl.moveFocusToPrevFocusable(api.dom.Element.fromHtmlElement(<HTMLElement>document.activeElement),
                    'input,li');
            }).setGlobal(true),
            new api.ui.KeyBinding('down', () => {
                api.dom.FormEl.moveFocusToNextFocusable(api.dom.Element.fromHtmlElement(<HTMLElement>document.activeElement),
                    'input,li');
            }).setGlobal(true)];

        api.ui.KeyBindings.get().bindKeys(keyBindings);
    }

    show() {
        this.getContentPanel().getParentElement().appendChild(this.loadMask);
        this.updateDialogTitlePath();

        this.fileInput.disable();
        this.newContentUploader.disable();
        this.resetFileInputWithUploader();

        super.show();

        if (!this.fileInput.isVisible()) {
            api.dom.Body.get().onKeyDown(this.keyDownHandler);
        }

        // CMS-3711: reload content types each time when dialog is show.
        // It is slow but newly create content types are displayed.
        this.loadContentTypes();
    }

    hide() {
        this.mostPopularContentTypes.hide();
        this.fileInput.hide();
        this.removeClass('filter-visible');
        this.clearAllItems();
        api.dom.Body.get().unKeyDown(this.keyDownHandler);

        super.hide();

        if (this.getContentPanel().getParentElement().hasChild(this.loadMask)) {
            this.getContentPanel().getParentElement().removeChild(this.loadMask);
        }
    }

    close() {
        this.fileInput.reset();
        this.newContentUploader.reset();

        if (this.isVisible()) {
            super.close();
        }
    }

    private loadContentTypes() {

        this.loadMask.show();

        wemQ.all(this.sendRequestsToFetchContentData())
            .spread((contentTypes: ContentTypeSummaries, aggregations: AggregateContentTypesResult,
                     parentSite: Site) => {

                this.allContentTypes.createItems(contentTypes, parentSite);

                this.mostPopularContentTypes.getItemsList().createItems(contentTypes, aggregations);
                this.recentContentTypes.getItemsList().createItems(this.allContentTypes.getItems());

            }).catch((reason: any) => {

            api.DefaultErrorHandler.handle(reason);

        }).finally(() => {
            this.fileInput.enable();
            this.newContentUploader.enable();
            this.fileInput.giveFocus();
            this.toggleUploadersEnabled();
            this.loadMask.hide();
            this.mostPopularContentTypes.showIfNotEmpty();
        }).done();
    }

    private sendRequestsToFetchContentData(): wemQ.Promise<any>[] {
        const requests: wemQ.Promise<any>[] = [];
        requests.push(new GetAllContentTypesRequest().sendAndParse().then((contentTypes: ContentTypeSummary[]) => {
            return new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
                return this.filterContentTypes(ContentTypeSummaries.from(contentTypes), loginResult);
            });
        }));

        if (this.parentContent) {
            requests.push(new AggregateContentTypesByPathRequest(this.parentContent.getPath()).sendAndParse());
            requests.push(new GetNearestSiteRequest(this.parentContent.getContentId()).sendAndParse());
        } else {
            requests.push(new AggregateContentTypesByPathRequest(ContentPath.ROOT).sendAndParse());
        }

        return requests;
    }

    private filterContentTypes(contentTypes: ContentTypeSummaries, loginResult: LoginResult): ContentTypeSummaries {
        const isContentAdmin: boolean = loginResult.isContentAdmin();
        return contentTypes.filter(contentType => !contentType.isUnstructured() && (isContentAdmin || !contentType.isSite()));
    }

    private updateDialogTitlePath() {
        if (this.parentContent) {
            this.getHeader().setPath(this.parentContent.getPath().toString());
        } else {
            this.getHeader().setPath('');
        }
    }

    private clearAllItems() {
        this.mostPopularContentTypes.getItemsList().clearItems();
        this.allContentTypes.clearItems();
        this.recentContentTypes.getItemsList().clearItems();
    }

    private toggleUploadersEnabled() {
        const uploaderEnabled = !this.parentContent || !this.parentContent.getType().isTemplateFolder();
        this.toggleClass('no-uploader-el', !uploaderEnabled);
        this.newContentUploader.setEnabled(uploaderEnabled);
    }

    private resetFileInputWithUploader() {
        this.fileInput.reset();
        this.newContentUploader.reset();
        this.newContentUploader.setEnabled(false);
    }
}

export class NewContentDialogHeader
    extends api.ui.dialog.DefaultModalDialogHeader {

    private pathEl: api.dom.PEl;

    constructor(title: string, path: string) {
        super(title);

        this.pathEl = new api.dom.PEl('path');
        this.pathEl.getEl().setAttribute('data-desc', `${i18n('dialog.newContent.pathDescription')}:`);
        this.pathEl.setHtml(path);
        this.appendChild(this.pathEl);
    }

    setPath(path: string) {
        this.pathEl.setHtml(path).setVisible(!api.util.StringHelper.isBlank(path));
    }
}
