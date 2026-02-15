import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {UploadItem} from '@enonic/lib-admin-ui/ui/uploader/UploadItem';
import {UploaderEl, type UploaderElConfig} from '@enonic/lib-admin-ui/ui/uploader/UploaderEl';
import {CreateMediaFromUrlRequest} from '../../../resource/CreateMediaFromUrlRequest';
import {type Content, ContentBuilder} from '../../../content/Content';
import {type ContentJson} from '../../../content/ContentJson';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {type Value} from '@enonic/lib-admin-ui/data/Value';
import {UrlHelper} from '../../../util/UrlHelper';
import {ContentResourceRequest} from '../../../resource/ContentResourceRequest';
import {type Project} from '../../../settings/data/project/Project';

export enum MediaUploaderElOperation {
    create,
    update
}

export interface MediaUploaderElConfig
    extends UploaderElConfig {

    operation: MediaUploaderElOperation;

    project?: Project;
}

export class MediaUploaderEl
    extends UploaderEl<Content> {

    declare protected config: MediaUploaderElConfig;

    private fileName: string;

    private link: AEl;

    constructor(config: MediaUploaderElConfig) {

        if (config.url == null) {
            config.url = `content/content/${MediaUploaderElOperation[config.operation]}Media`;
        }

        super(config);

        this.addClass('media-uploader-el');

        this.initImageDropHandler();
    }

    protected beforeSubmit() {
        this.uploader.setEndpoint(UrlHelper.getCmsRestUri(`${UrlHelper.getCMSPath(null, this.config.project)}/${this.config.url}`));
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
        const isImgUrlDragged: boolean = data && !!(/<img.*\ssrc="/i.exec(data));

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

        const uploadItem = new UploadItem<Content>({name});
        this.notifyFileUploadStarted([uploadItem]);

        new CreateMediaFromUrlRequest()
            .setRequestProject(this.config.project)
            .setName(name)
            .setUrl(imgSrc)
            .setParent(parent)
            .sendAndParse().then((content: Content) => {
                uploadItem.setModel(content);
                this.notifyFileUploaded(uploadItem);
            }).catch((reason) => {
            DefaultErrorHandler.handle(reason);
        }).done();
    }

    private generateUniqueName(imgSrc: string): string {
        const imgFormatRegExp: RegExpMatchArray = /image\/([a-z]+?);/i.exec(imgSrc);
        const type: string = imgFormatRegExp ? imgFormatRegExp[1] ? imgFormatRegExp[1] : 'jpg' : 'jpg';

        const date: Date = new Date();
        const dateParts: number[] =
            [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];

        return 'image-' + dateParts.map(DateHelper.padNumber).join('') + '.' + type;
    }

    createModel(serverResponse: ContentJson): Content {
        if (serverResponse) {
            return new ContentBuilder().fromContentJson(serverResponse).build();
        } else {
            return null;
        }
    }

    getModelValue(item: Content): string {
        return item.getId();
    }

    getMediaValue(item: Content): Value {
        const mediaProperty = item.getContentData().getProperty('media');
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
        const path: string =
            `${UrlHelper.getCMSPathForContentRoot(this.config.project)}/${ContentResourceRequest.CONTENT_PATH}/media/${value}`;
        this.link = new AEl().setUrl(UrlHelper.getCmsRestUri(path), '_blank');
        this.link.setHtml(this.fileName != null && this.fileName !== '' ? this.fileName : value);

        return this.link;
    }
}
