import {Element} from 'lib-admin-ui/dom/Element';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {ValueTypes} from 'lib-admin-ui/data/ValueTypes';
import {UploadItem} from 'lib-admin-ui/ui/uploader/UploadItem';
import {UploaderEl, UploaderElConfig} from 'lib-admin-ui/ui/uploader/UploaderEl';
import {CreateMediaFromUrlRequest} from '../../../resource/CreateMediaFromUrlRequest';
import {Content, ContentBuilder} from '../../../content/Content';
import {ContentJson} from '../../../content/ContentJson';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {Value} from 'lib-admin-ui/data/Value';
import {UrlHelper} from '../../../util/UrlHelper';

export enum MediaUploaderElOperation {
    create,
    update
}

export interface MediaUploaderElConfig
    extends UploaderElConfig {

    operation: MediaUploaderElOperation;
}

export class MediaUploaderEl
    extends UploaderEl<Content> {

    private fileName: string;

    private link: AEl;

    constructor(config: MediaUploaderElConfig) {

        if (config.url == null) {
            config.url = `content/${MediaUploaderElOperation[config.operation]}Media`;
        }

        super(config);

        this.addClass('media-uploader-el');

        this.initImageDropHandler();
    }

    protected beforeSubmit() {
        this.uploader.setEndpoint(UriHelper.getRestUri(`${UrlHelper.getCMSPath()}/${this.config.url}`));
    }

    private initImageDropHandler() {
        this.onDropzoneDrop((dropEvent: DragEvent) => {
            this.handleDraggedUrls(dropEvent);
        });
    }

    private handleDraggedUrls(dropEvent: DragEvent) {
        const isFileDropped: boolean = dropEvent.dataTransfer.files.length > 0;

        if (this.isUploading() || isFileDropped) {
            return;
        }

        const data: string = dropEvent.dataTransfer.getData('text/html');
        const isImgUrlDragged: boolean = data && !!data.match(/<img.*\ssrc="/i);

        if (!isImgUrlDragged) {
            return;
        }

        this.extractImagesFromDragData(data).map((img) => img.getAttribute('src')).forEach(this.uploadDraggedImg.bind(this));
    }

    private extractImagesFromDragData(data: string): HTMLElement[] {
        const tempDiv: HTMLElement = document.createElement('div');
        tempDiv.innerHTML = data;

        return [].slice.call(tempDiv.getElementsByTagName('img'));
    }

    private isSrcWithData(imgSrc: string): boolean {
        return imgSrc && imgSrc.substring(0, 5) === 'data:';
    }

    private uploadDraggedImg(imgSrc: string) {
        if (this.isSrcWithData(imgSrc)) {
            this.uploadUrlEncodedImage(imgSrc);
        } else {
            this.uploadRemoteImage(imgSrc);
        }
    }

    private uploadUrlEncodedImage(imgSrc: string) {
        const request: XMLHttpRequest = new XMLHttpRequest();
        request.open('GET', imgSrc, true);
        request.responseType = 'blob';
        request.onload = () => {
            const uploadedFile: Blob = request.response;
            const file: File = new File([uploadedFile], this.generateUniqueName(imgSrc));
            this.uploader.addFiles([file]);
        };
        request.send();
    }

    private uploadRemoteImage(imgSrc: string) {
        const name: string = this.generateUniqueName(imgSrc);
        const parent: string = this.config.params.parent;

        const uploadItem = new UploadItem<Content>(<any>{name: name});
        this.notifyFileUploadStarted([uploadItem]);

        new CreateMediaFromUrlRequest().setName(name).setUrl(imgSrc).setParent(parent).sendAndParse().then(
            (content: Content) => {
                uploadItem.setModel(<any>content);
                this.notifyFileUploaded(uploadItem);
            }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        }).done();
    }

    private generateUniqueName(imgSrc: string): string {
        const imgFormatRegExp: RegExpMatchArray = imgSrc.match(/image\/([a-z]+?);/i);
        const type: string = imgFormatRegExp ? imgFormatRegExp[1] ? imgFormatRegExp[1] : 'jpg' : 'jpg';

        const date: Date = new Date();
        const dateParts: number[] =
            [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];

        return 'image-' + dateParts.map(DateHelper.padNumber).join('') + '.' + type;
    }

    createModel(serverResponse: ContentJson): Content {
        if (serverResponse) {
            return new ContentBuilder().fromContentJson(<ContentJson> serverResponse).build();
        } else {
            return null;
        }
    }

    getModelValue(item: Content): string {
        return item.getId();
    }

    getMediaValue(item: Content): Value {
        let mediaProperty = item.getContentData().getProperty('media');
        let mediaValue;
        switch (mediaProperty.getType()) {
        case ValueTypes.DATA:
            mediaValue = mediaProperty.getPropertySet().getProperty('attachment').getValue();
            break;
        case ValueTypes.STRING:
            mediaValue = mediaProperty.getValue();
            break;
        }
        return mediaValue;
    }

    setFileName(name: string) {
        this.fileName = name;
        if (this.link && this.fileName != null && this.fileName !== '') {
            this.link.setHtml(this.fileName);
        }
    }

    createResultItem(value: string): Element {
        this.link = new AEl().setUrl(UriHelper.getRestUri(`${UrlHelper.getCMSPath()}/content/media/${value}`), '_blank');
        this.link.setHtml(this.fileName != null && this.fileName !== '' ? this.fileName : value);

        return this.link;
    }
}
