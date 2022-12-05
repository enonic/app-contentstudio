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

export class NewContentButton
    extends ButtonEl {

    private static newContentDialog: NewContentDialog;

    private readonly content: ContentSummary;

    private readonly allowedContentTypes: string[];

    private contentAddedListeners: { (content: ContentSummary): void }[] = [];

    constructor(content: ContentSummary, allowedContentTypes: string[]) {
        super();

        this.addClass('new-content-button icon-plus');
        this.content = content;
        this.allowedContentTypes = allowedContentTypes;

        this.initEventListeners();
    }

    private static getContentDialog(): NewContentDialog {
        if (!NewContentButton.newContentDialog) {
            NewContentButton.newContentDialog = new NewContentDialog();
        }

        return NewContentButton.newContentDialog;
    }

    private initEventListeners(): void {
        const typeSelectedHandler: (contentType: ContentTypeSummary, parentContent?: ContentSummary) => void =
            this.typeSelectedHandler.bind(this);

        this.onClicked(() => {
            NewContentButton.getContentDialog()
                .setParentContent(this.content)
                .setAllowedContentTypes(this.allowedContentTypes)
                .setTypeSelectedHandler(typeSelectedHandler)
                .open();
        });
    }

    private typeSelectedHandler(contentType: ContentTypeSummary, parentContent?: ContentSummary): void {
        this.createContent(contentType, parentContent).then((content: Content) => {
            this.handleContentCreated(content);
        }).catch(DefaultErrorHandler.handle);
    }

    private createContent(contentType: ContentTypeSummary, parentContent?: ContentSummary): Q.Promise<Content> {
        return ContentHelper.makeNewContentRequest(contentType.getContentTypeName(), parentContent?.getPath()).sendAndParse();
    }

    private handleContentCreated(content: Content): void {
        this.notifyContentAdded(content);
        new EditContentEvent([ContentSummaryAndCompareStatus.fromContentSummary(content)]).fire();
    }

    onContentAdded(listener: (content: ContentSummary) => void): void {
        this.contentAddedListeners.push(listener);
    }

    unContentAdded(listener: (content: ContentSummary) => void): void {
        this.contentAddedListeners = this.contentAddedListeners.filter((currentListener: Function) => listener !== currentListener);
    }

    private notifyContentAdded(content: ContentSummary): void {
        this.contentAddedListeners.forEach((listener: Function) => listener(content));
    }
}
