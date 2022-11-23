import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {NewContentDialog} from '../../../create/NewContentDialog';
import {NewMediaUploadEvent} from '../../../create/NewMediaUploadEvent';
import {Content} from '../../../content/Content';
import {NewContentEvent} from '../../../create/NewContentEvent';
import {ContentSummaryAndCompareStatus} from '../../../content/ContentSummaryAndCompareStatus';
import {ContentServerEventsHandler} from '../../../event/ContentServerEventsHandler';
import {UploadItem} from '@enonic/lib-admin-ui/ui/uploader/UploadItem';
import {ContentSummary} from '../../../content/ContentSummary';

export class NewContentButton extends ButtonEl {

    private static newContentDialog: NewContentDialog;

    private readonly content: ContentSummary;

    private contentAddedListeners: { (content: ContentSummary): void }[] = [];

    constructor(content: ContentSummary) {
        super();

        this.addClass('new-content-button icon-plus');
        this.content = content;
        this.initEventListeners();
    }

    private static getContentDialog(): NewContentDialog {
        if (!NewContentButton.newContentDialog) {
            NewContentButton.newContentDialog = new NewContentDialog();
        }

        return NewContentButton.newContentDialog;
    }

    private initEventListeners(): void {
        const newContentHandler: () => void = () => {
            this.waitForContentCreate();
        };

        const newMediaHandler: (event: NewMediaUploadEvent) => void = (event: NewMediaUploadEvent) => {
            event.getUploadItems().forEach((uploadItem: UploadItem<Content>) => {
                uploadItem.onUploaded((uploadedContent: Content) => {
                    this.notifyContentAdded(uploadedContent);
                });
            });
        };

        const dialogClosedHandler: () => void = () => {
            NewContentButton.getContentDialog().unClosed(dialogClosedHandler);
            NewContentEvent.un(newContentHandler);
            NewMediaUploadEvent.un(newMediaHandler);
        };

        this.onClicked(() => {
            const dialog: NewContentDialog = NewContentButton.getContentDialog();
            dialog.setParentContent(this.content);
            dialog.open();

            dialog.onClosed(dialogClosedHandler);
            NewContentEvent.on(newContentHandler);
            NewMediaUploadEvent.on(newMediaHandler);
        });
    }

    private waitForContentCreate(): void {
        const createHandler = (data: ContentSummaryAndCompareStatus[]) => {
            const createdItem: ContentSummaryAndCompareStatus =
                data.find((item: ContentSummaryAndCompareStatus) => item.getPath().getParentPath().equals(this.content.getPath()));

            if (createdItem) {
                this.notifyContentAdded(createdItem.getContentSummary());
            }
        };

        ContentServerEventsHandler.getInstance().onContentCreated(createHandler);

        setTimeout(() => { // waiting for a content creation event
            ContentServerEventsHandler.getInstance().unContentCreated(createHandler);
        }, 3000);
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
