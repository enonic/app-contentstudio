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

export class NewContentButton
    extends ButtonEl {

    private static ICON_PLUS: string = 'icon-plus';

    private static ICON_LOAD: string = 'icon-spinner';

    private static newContentDialog: NewContentDialog;

    private readonly content: ContentSummary;

    private typeSelectedHandler: (contentType: ContentTypeSummary, parentContent?: ContentSummary) => void;

    private readonly allowedContentTypes?: string[];

    private contentAddedListeners: { (content: ContentSummary): void }[] = [];

    constructor(content: ContentSummary, allowedContentTypes?: string[]) {
        super();

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
        this.typeSelectedHandler = this.handleTypeSelected.bind(this);
        this.onClicked(() => this.handleButtonClicked());
    }

    private handleButtonClicked(): void {
        this.setIsLoading(true);

        this.loadContentTypes()
            .then((types: ContentTypeSummary[]) => this.handleTypesLoaded(types))
            .catch(DefaultErrorHandler.handle)
            .finally(() => this.setIsLoading(false));
    }

    private loadContentTypes(): Q.Promise<ContentTypeSummary[]> {
        return ContentTypesHelper.getAvailableContentTypes(this.content, this.allowedContentTypes);
    }

    private handleTypesLoaded(types: ContentTypeSummary[]): void {
        if (!types || types.length === 0) {
            return;
        }

        if (types.length === 1) {
            this.handleTypeSelected(types[0], this.content);
        } else {
            this.openNewContentDialog(types);
        }
    }

    private openNewContentDialog(types: ContentTypeSummary[]): void {
        NewContentButton.getContentDialog()
            .setParentContent(this.content)
            .setContentTypes(types)
            .setAllowedContentTypes(this.allowedContentTypes)
            .setTypeSelectedHandler(this.typeSelectedHandler)
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
        return ContentHelper.makeNewContentRequest(contentType.getContentTypeName(), parentContent?.getPath()).sendAndParse();
    }

    private handleContentCreated(content: Content): void {
        this.notifyContentAdded(content);
        new EditContentEvent([ContentSummaryAndCompareStatus.fromContentSummary(content)]).setDisplayAsNew(true).fire();
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

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.addClass(`new-content-button ${NewContentButton.ICON_PLUS}`);

            return rendered;
        });
    }
}
