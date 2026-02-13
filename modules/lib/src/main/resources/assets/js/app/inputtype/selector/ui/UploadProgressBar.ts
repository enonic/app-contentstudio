import {ProgressBar} from '@enonic/lib-admin-ui/ui/ProgressBar';
import {type UploadItem} from '@enonic/lib-admin-ui/ui/uploader/UploadItem';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {FormItemEl} from '@enonic/lib-admin-ui/dom/FormItemEl';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';

export class UploadProgressBar<T extends Equitable> extends ProgressBar {

    private static UPLOADING_CLASS: string = 'uploading';

    private uploadItems: UploadItem<T>[];

    private readonly container: Element;

    private readonly progressMap: Map<string, number> = new Map<string, number>();

    private currentlyUploadedPercentage: number = 0; // sum of uploaded percents of ALL items to compare with absolute value

    private itemsUploadedOrFailed: number = 0;

    private itemUploadedHandler?: (content: T) => void;

    private itemUploadFailedHandler?: (item: UploadItem<T>) => void;

    constructor(parentElement: Element) {
        super(0);
        this.container = parentElement;

        this.addClass('upload-progress-bar');
    }

    setItems(uploadItems: UploadItem<T>[]): void {
        if (uploadItems?.length === 0) {
            return;
        }

        this.uploadItems = uploadItems;
        this.progressMap.clear();
        this.currentlyUploadedPercentage = 0;
        this.itemsUploadedOrFailed = 0;
        this.setValue(0);
        this.toggleParentElementState(true);

        this.listenItemsUploadEvents();

        return;
    }

    setItemUploadedHandler(handler: (content: T) => void): UploadProgressBar<T> {
        this.itemUploadedHandler = handler;
        return this;
    }

    setItemUploadFailed(handler: (item: UploadItem<T>) => void): UploadProgressBar<T> {
        this.itemUploadFailedHandler = handler;
        return this;
    }

    private listenItemsUploadEvents(): void {
        this.uploadItems.forEach((item: UploadItem<T>) => {
            this.listenItemEvents(item);
        });
    }

    private listenItemEvents(item: UploadItem<T>): void {
        item.onProgress((progress: number) => {
            this.handleItemProgress(item, progress);
        });

        item.onUploaded((content: T) => {
            this.handleItemUploaded(content);
        });

        item.onFailed(() => {
            this.handleItemUploadFailed(item);
        });
    }

    private handleItemProgress(item: UploadItem<T>, progress: number): void {
        this.progressMap.set(item.getId(), progress);
        let currentTotal: number = 0;

        this.progressMap.forEach((value: number) => {
            currentTotal += value;
        });

        const result: number = currentTotal / this.uploadItems.length * 100 * 100;

        this.setValue(Math.trunc(result));
    }

    private handleItemUploaded(content: T): void {
        this.itemsUploadedOrFailed++;

        if (this.itemsUploadedOrFailed === this.uploadItems.length) {
            this.toggleParentElementState(false);
        }

        if (this.itemUploadedHandler) {
            this.itemUploadedHandler(content);
        }
    }

    private handleItemUploadFailed(item: UploadItem<T>): void {
        this.itemsUploadedOrFailed++;

        if (this.itemsUploadedOrFailed === this.uploadItems.length) {
            this.toggleParentElementState(false);
        }

        if (this.itemUploadFailedHandler) {
            this.itemUploadFailedHandler(item);
        }
    }

    private toggleParentElementState(isUploading: boolean): void {
        this.container.toggleClass(UploadProgressBar.UPLOADING_CLASS, isUploading);

        if (isUploading) {
            this.container.appendChild(this);
        } else {
            this.container.removeChild(this);
        }

        if (this.container instanceof FormItemEl) {
            this.container.setEnabled(!isUploading);
        }
    }


}
