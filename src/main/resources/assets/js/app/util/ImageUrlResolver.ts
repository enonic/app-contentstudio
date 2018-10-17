import ContentId = api.content.ContentId;

export interface ImageUrlParameters {
    id: string;
    useOriginal?: boolean;
    scale?: string;
}

export class ImagePreviewUrlResolver extends api.icon.IconUrlResolver {

    protected contentId: ContentId;

    protected size: number = 0;

    private ts: string = null;

    private scaleWidth: boolean = false; // parameter states if width of the image must be preferred over its height

    protected useOriginal: boolean = false; // parameter states if the source image should be used (without processing)

    protected scale: string = null; //scale params applied to image

    setTimestamp(value: Date): ImagePreviewUrlResolver {
        this.ts = '' + value.getTime();
        return this;
    }

    setContentId(value: api.content.ContentId): ImagePreviewUrlResolver {
        this.contentId = value;
        return this;
    }

    setWidth(value: number): ImagePreviewUrlResolver {
        this.setSize(value).scaleWidth = true;
        return this;
    }

    setSize(value: number): ImagePreviewUrlResolver {
        this.size = Math.floor(value);
        return this;
    }

    setUseOriginal(value: boolean): ImagePreviewUrlResolver {
        this.useOriginal = value;
        return this;
    }

    setScaleWidth(value: boolean): ImagePreviewUrlResolver {
        this.scaleWidth = value;
        return this;
    }

    setScale(value: string): ImagePreviewUrlResolver {
        this.scale = value;
        return this;
    }

    resolve(): string {
        let url = 'content/image/' + this.contentId.toString();

        if (this.ts) {
            url = this.appendParam('ts', this.ts, url);
        }

        if (this.useOriginal) {
            url = this.appendParam('source', 'true', url);
        }
        else {
            if (this.size) {
                url = this.appendParam('size', '' + this.size, url);
            }

            if (this.scaleWidth) {
                url = this.appendParam('scaleWidth', 'true', url);
            }

            if (this.scale) {
                url = this.appendParam('scale', this.scale, url);
            }
        }

        return api.util.UriHelper.getRestUri(url);
    }

}

export class ImageRenderUrlResolver extends ImagePreviewUrlResolver {
    public static imagePrefix: string = 'image://';

    resolve(): string {

        let url = ImageRenderUrlResolver.imagePrefix + this.contentId.toString();

        if (this.useOriginal) {
            url = this.appendParam('keepSize', 'true', url);
        }
        else {
            if (this.size) {
                url = this.appendParam('size', '' + this.size, url);
            }

            if (this.scale) {
                url = this.appendParam('scale', this.scale, url);
            }
        }

        return url;
    }
}