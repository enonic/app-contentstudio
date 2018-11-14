import ContentId = api.content.ContentId;
/*
export interface ImageUrlParameters {
    id: string;
    useOriginal?: boolean;
    scale?: string;
    filter?: string;
    timeStamp?: Date;
}
*/

export class ImagePreviewUrlResolver {
    id: string;
    useOriginal: boolean = false; // serve original unprocessed image
    aspectRatio: string;
    filter: string;
    timeStamp: Date;
    scaleWidth: boolean = false; // if width of the image must be preferred over its height
    ts: string;
    size: number; // width if scaleWidth=true, otherwise height

    setId(value: string): ImagePreviewUrlResolver {
        this.id = value;
        return this;
    }

    setScaleWidth(): ImagePreviewUrlResolver {
        this.scaleWidth = true;
        return this;
    }

    setUseOriginal(value: boolean): ImagePreviewUrlResolver {
        this.useOriginal = value;
        return this;
    }

    setAspectRatio(value: string): ImagePreviewUrlResolver {
        this.aspectRatio = value;
        return this;
    }

    setFilter(value: string): ImagePreviewUrlResolver {
        this.filter = value;
        return this;
    }

    setTimestamp(value: Date): ImagePreviewUrlResolver {
        this.timeStamp = value;
        return this;
    }

    setSize(value: number): ImagePreviewUrlResolver {
        this.size = Math.floor(value);
        return this;
    }

    setWidth(value: number): ImagePreviewUrlResolver {
        return this.setScaleWidth().setSize(value);
    }

    resolve(): string {
        return new ImagePreviewUrlBuilder(this).build();
    }
}

export class ImagePreviewUrlBuilder extends api.icon.IconUrlResolver {

    private static maxImageWidth: number = 600; // Modal dialog width (660px) minus side padding (2*30px)

    protected contentId: ContentId;
    private useOriginal: boolean;
    private aspectRatio: string;
    private filter: string;
    private timeStamp: Date;
    private scaleWidth: boolean;
    private size: number;

    protected readonly useOriginalParamName: string = 'source';

    constructor(params: ImagePreviewUrlResolver) {
        super();

        this.contentId = new api.content.ContentId(params.id);
        this.useOriginal = params.useOriginal;
        this.timeStamp = params.timeStamp;

        if (!this.useOriginal) {
            // Apply these params only if serving of the original image is not forced
            this.size = params.size;
            this.scaleWidth = params.scaleWidth;
            this.aspectRatio = params.aspectRatio;
            this.filter = params.filter;

            if (this.scaleWidth && !this.size) { // if width is preferred over height but not specifically set, use a constant
                this.size = ImagePreviewUrlBuilder.maxImageWidth;
            }
        }
    }

    protected getBaseUrl(): string {
        const url = 'content/image/' + this.contentId.toString();

        return api.util.UriHelper.getRestUri(url);
    }

    build(): string {
        let url = this.getBaseUrl();

        if (this.timeStamp) {
            url = this.appendParam('ts', '' + this.timeStamp, url);
        }

        if (this.useOriginal) {
            url = this.appendParam(this.useOriginalParamName, 'true', url);
        }
        else {
            if (this.size) {
                url = this.appendParam('size', '' + this.size, url);
            }

            if (this.scaleWidth) {
                url = this.appendParam('scaleWidth', 'true', url);
            }

            if (this.aspectRatio) {
                url = this.appendParam('scale', this.aspectRatio, url);
            }

            if (this.filter) {
                url = this.appendParam('filter', this.filter, url);
            }
        }

        return url;
    }

}

export class ImageRenderUrlResolver extends ImagePreviewUrlResolver {

    public static imagePrefix: string = 'image://';

    protected readonly useOriginalParamName: string = 'keepSize';

    protected getBaseUrl(): string {
        return ImageRenderUrlResolver.imagePrefix + this.contentId.toString();
    }

}