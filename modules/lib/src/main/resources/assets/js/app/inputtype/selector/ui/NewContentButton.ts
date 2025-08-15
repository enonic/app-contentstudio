import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {NewContentDialog} from '../../../create/NewContentDialog';
import {ContentSummary} from '../../../content/ContentSummary';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Content} from '../../../content/Content';
import {EditContentEvent} from '../../../event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from '../../../content/ContentSummaryAndCompareStatus';
import * as Q from 'q';
import {ContentHelper} from '../../../util/ContentHelper';
import {ContentTypesHelper} from '../../../util/ContentTypesHelper';
import {ContentServerEventsHandler} from '../../../event/ContentServerEventsHandler';
import {UploadItem} from '@enonic/lib-admin-ui/ui/uploader/UploadItem';
import {UploadProgressBar} from './UploadProgressBar';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentPath} from '../../../content/ContentPath';
import {Project} from '../../../settings/data/project/Project';

export interface NewContentButtonParams {
    content?: ContentSummary,
    allowedContentTypes?: string[],
    project?: Project;
}

export class NewContentButton
    extends ButtonEl {

    private static ICON_PLUS: string = 'icon-plus';

    private static ICON_LOAD: string = 'icon-spinner';

    private static newContentDialog: NewContentDialog;

    private content?: ContentSummary;

    private project?: Project;

    private typeSelectedHandler: (contentType: ContentTypeSummary, parentContent?: ContentSummary) => void;

    private dialogUploadHandler: (items: UploadItem<Content>[]) => void;

    private uploadHandler?: UploadProgressBar<Content>;

    private readonly allowedContentTypes?: string[];

    private contentAddedListeners: ((content: ContentSummary) => void)[] = [];

    constructor(params?: NewContentButtonParams) {
        super();

        this.content = params?.content;
        this.allowedContentTypes = params?.allowedContentTypes;
        this.project = params?.project;

        this.initEventListeners();
    }

    private static getContentDialog(): NewContentDialog {
        if (!NewContentButton.newContentDialog) {
            NewContentButton.newContentDialog = new NewContentDialog();
        }

        return NewContentButton.newContentDialog;
    }

    private initEventListeners(): void {
        this.typeSelectedHandler = this.handleTypeSelected.bind(this);
        this.onClicked(() => this.handleButtonClicked());
        this.dialogUploadHandler = this.handleUpload.bind(this);

        if (this.content) {
            ContentServerEventsHandler.getInstance().onContentUpdated(this.handleContentUpdateEvent.bind(this));
        }
    }

    private handleButtonClicked(): void {
        this.setIsLoading(true);

        this.loadContentTypes()
            .then((types: ContentTypeSummary[]) => this.handleTypesLoaded(types))
            .catch(DefaultErrorHandler.handle)
            .finally(() => this.setIsLoading(false));
    }

    private loadContentTypes(): Q.Promise<ContentTypeSummary[]> {
        return ContentTypesHelper.getAvailableContentTypes({
            contentId: this.content?.getContentId(),
            allowedContentTypes: this.allowedContentTypes,
            project: this.project
        });
    }

    private handleUpload(items: UploadItem<Content>[]): void {
        if (!this.uploadHandler) {
            this.uploadHandler = new UploadProgressBar<Content>(this)
                .setItemUploadedHandler(this.handleContentCreated.bind(this))
                .setItemUploadFailed(this.handleItemUploadFailed.bind(this));
        }

        this.uploadHandler.setItems(items);
    }

    private isNewContentDialogRequired(types: ContentTypeSummary[]): boolean {
        if (types.length !== 1) {
            return true;
        }

        return types[0].getContentTypeName().isDescendantOfMedia();
    }

    private handleTypesLoaded(types: ContentTypeSummary[]): void {
        if (this.isNewContentDialogRequired(types)) {
            this.openNewContentDialog(types);
        } else if (types.length === 1) {
            this.handleTypeSelected(types[0], this.content);
        }
    }

    private openNewContentDialog(types: ContentTypeSummary[]): void {
        NewContentButton.getContentDialog()
            .setParentContent(this.content)
            .setContentTypes(types)
            .setTypeSelectedHandler(this.typeSelectedHandler)
            .setProject(this.project)
            .setUploadHandler(this.dialogUploadHandler)
            .open();
    }

    private setIsLoading(isLoading: boolean): void {
        this.toggleClass(NewContentButton.ICON_PLUS, !isLoading);
        this.toggleClass(NewContentButton.ICON_LOAD, isLoading);
    }

    private handleTypeSelected(contentType: ContentTypeSummary, parentContent?: ContentSummary): void {
        this.createContent(contentType, parentContent).then((content: Content) => {
            this.handleContentCreated(content);
        }).catch(DefaultErrorHandler.handle);
    }

    private createContent(contentType: ContentTypeSummary, parentContent?: ContentSummary): Q.Promise<Content> {
        return ContentHelper.makeNewContentRequest(contentType.getContentTypeName())
            .setParent(parentContent?.getPath() || ContentPath.getRoot())
            .setRequestProject(this.project)
            .sendAndParse();
    }

    private handleContentCreated(content: Content): void {
        this.notifyContentAdded(content);
        new EditContentEvent([ContentSummaryAndCompareStatus.fromContentSummary(content)], this.project).setDisplayAsNew(true).fire();
    }

    private handleItemUploadFailed(item: UploadItem<Content>): void {
        NotifyManager.get().showWarning(i18n('notify.upload.failure', item.getName()));
    }

    private handleContentUpdateEvent(data: ContentSummaryAndCompareStatus[]): void {
        const currentContent: ContentSummaryAndCompareStatus =
            data.find((content: ContentSummaryAndCompareStatus) => content.getId() === this.content.getId());
        this.content = currentContent?.getContentSummary() || this.content;
    }

    onContentAdded(listener: (content: ContentSummary) => void): void {
        this.contentAddedListeners.push(listener);
    }

    unContentAdded(listener: (content: ContentSummary) => void): void {
        this.contentAddedListeners = this.contentAddedListeners.filter((currentListener: (content: ContentSummary) => void) => listener !== currentListener);
    }

    private notifyContentAdded(content: ContentSummary): void {
        this.contentAddedListeners.forEach((listener: (content: ContentSummary) => void) => listener(content));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.addClass(`new-content-button ${NewContentButton.ICON_PLUS}`);

            return rendered;
        });
    }
}
