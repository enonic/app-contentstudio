declare var CONFIG;

export interface ImageUrlParameters {
    id: string;
    useActualWidth?: boolean;
    scale?: string;
}

export class ImagePreviewUrlResolver extends api.icon.IconUrlResolver {

    public static maxImageWidth: number = 610; // Modal dialog width (660px) minus side padding (30px + 20px)
    protected contentId: api.content.ContentId;
    protected width: string = '' + ImagePreviewUrlResolver.maxImageWidth;
    protected scale: string;
    protected useActualWidth: boolean = false;

    setContentId(value: api.content.ContentId): ImagePreviewUrlResolver {
        this.contentId = value;
        return this;
    }

    setWidth(value: string): ImagePreviewUrlResolver {
        this.width = value;
        return this;
    }

    setUseActualWidth(value: boolean): ImagePreviewUrlResolver {
        this.useActualWidth = value;
        return this;
    }

    setScale(value: string): ImagePreviewUrlResolver {
        this.scale = value;
        return this;
    }

    resolve(): string {

        let url = this.appendParam('id', this.contentId.toString(), CONFIG.imagePreviewUrl);

        if (this.scale) {
            url = this.appendParam('scale', this.scale, url);
        }

        if (this.useActualWidth) {
            url = this.appendParam('actual', 'true', url);
        }
        else {
            url = this.appendParam('width', this.width, url);
        }

        return url;
    }
}

export class ImageRenderUrlResolver extends ImagePreviewUrlResolver {
    public static imagePrefix: string = 'image://';

    resolve(): string {

        let url = ImageRenderUrlResolver.imagePrefix + this.contentId.toString();

        if (this.scale) {
            url = this.appendParam('scale', this.scale, url);
        }

        if (this.useActualWidth) {
            url = this.appendParam('keepSize', 'true', url);
        }
        else {
            url = this.appendParam('size', this.width, url);
        }

        return url;
    }
}