import ContentId = api.content.ContentId;
import IconUrlResolver = api.icon.IconUrlResolver;
import UriHelper = api.util.UriHelper;

interface ImageUrlProperties {
    imagePrefix: string;
    isAbsoluteUrl: boolean;
}

export class ImageUrlResolver
    extends IconUrlResolver {

    static readonly PREVIEW: ImageUrlProperties = {
        imagePrefix: 'content/image/',
        isAbsoluteUrl: true
    };

    static readonly RENDER: ImageUrlProperties = {
        imagePrefix: 'image://',
        isAbsoluteUrl: false
    };

    private contentId: ContentId;

    private timeStamp: Date;

    private scaleWidth: boolean = true;

    private crop: boolean = true;

    private size: number;

    private aspectRatio: string; //scale params applied to image

    private filter: string;

    setContentId(value: ContentId): ContentImageUrlResolver {
        this.contentId = value;
        return this;
    }

    setSize(value: number): ContentImageUrlResolver {
        this.size = Math.floor(value);
        return this;
    }

    setTimestamp(value: Date): ContentImageUrlResolver {
        this.timeStamp = value;
        return this;
    }

    setScaleWidth(value: boolean): ContentImageUrlResolver {
        this.scaleWidth = value;
        return this;
    }

    setCrop(value: boolean): ContentImageUrlResolver {
        this.crop = value;
        return this;
    }

    setAspectRatio(value: string): ContentImageUrlResolver {
        this.aspectRatio = value;
        return this;
    }

    setFilter(value: string): ContentImageUrlResolver {
        this.filter = value;
        return this;
    }

    resolveForPreview(): string {
        return this.resolve(ContentImageUrlResolver.PREVIEW);
    }

    resolveForRender(originalSize: boolean = false): string {
        return this.resolve(ContentImageUrlResolver.RENDER) + (originalSize ? 'keepSize=true' : '');
    }

    private getBaseUrl(urlProperties: ImageUrlProperties): string {
        const url = urlProperties.imagePrefix + this.contentId.toString();

        return urlProperties.isAbsoluteUrl ? api.util.UriHelper.getRestUri(url) : url;
    }

    private resolve(urlProperties: ImageUrlProperties): string {

        let url = this.getBaseUrl(urlProperties);

        if (this.timeStamp) {
            url = this.appendParam('ts', '' + this.timeStamp.getTime(), url);
        }

        if (this.size) {
            url = this.appendParam('size', '' + Math.floor(this.size), url);
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

        if (this.crop) {
            url = this.appendParam('crop', 'true', url);
        }

        return UriHelper.getRestUri(url);
    }
}
