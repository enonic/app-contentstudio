import ContentId = api.content.ContentId;
import {Style} from '../inputtype/ui/text/styles/Style';
import {StyleHelper} from '../inputtype/ui/text/styles/StyleHelper';
import ContentSummary = api.content.ContentSummary;

export interface ImageUrlParameters {
    id: string;
    useOriginal: boolean; // serve original unprocessed image
    aspectRatio?: string;
    filter?: string;
    timeStamp?: Date;
    scaleWidth?: boolean; // if width of the image must be preferred over its height
    size?: number;
}

interface ImageSrcAttributes {
    useOriginalParamName: string;
    imagePrefix: string;
    isAbsoluteUrl: boolean;
}

export class ImageUrlBuilder {

    private readonly params: ImageUrlParameters;

    static readonly PREVIEW: ImageSrcAttributes = {
        useOriginalParamName: 'source',
        imagePrefix: 'content/image/',
        isAbsoluteUrl: true
    };

    static readonly RENDER: ImageSrcAttributes = {
        useOriginalParamName: 'keepSize',
        imagePrefix: 'image://',
        isAbsoluteUrl: false
    };

    constructor(params: ImageUrlParameters) {
        this.params = params;
    }

    static fromImageContent(imageContent: ContentSummary, size?: number, style?: Style) {
        const imageUrlParams: ImageUrlParameters = {
            id: imageContent.getId(),
            useOriginal: false,
            timeStamp: imageContent.getModifiedTime(),
            scaleWidth: true
        };

        if (size) {
            imageUrlParams.size = size;
        }

        if (style) {
            imageUrlParams.useOriginal = StyleHelper.isOriginalImage(style.getName());
            imageUrlParams.aspectRatio = style.getAspectRatio();
            imageUrlParams.filter = style.getFilter();
        }

        return new ImageUrlBuilder(imageUrlParams);
    }

    private resolve(): ImagePreviewUrlBuilder {
        return new ImagePreviewUrlBuilder(this.params);
    }

    buildForPreview() {
        return this.resolve().build(ImageUrlBuilder.PREVIEW);
    }

    buildForRender() {
        return this.resolve().build(ImageUrlBuilder.RENDER, false);
    }

}

export class ImagePreviewUrlBuilder extends api.icon.IconUrlResolver {

    private static maxImageWidth: number = 640;

    protected readonly contentId: ContentId;
    private readonly useOriginal: boolean;
    private readonly aspectRatio: string;
    private readonly filter: string;
    private readonly timeStamp: Date;
    private readonly scaleWidth: boolean;
    private readonly size: number;

    constructor(params: ImageUrlParameters) {
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

    protected getBaseUrl(srcParams: ImageSrcAttributes): string {
        const url = srcParams.imagePrefix + this.contentId.toString();

        return srcParams.isAbsoluteUrl ? api.util.UriHelper.getRestUri(url) : url;
    }

    build(srcParams: ImageSrcAttributes, forPreview: boolean = true): string {
        let url = this.getBaseUrl(srcParams);

        if (forPreview && this.timeStamp) {
            url = this.appendParam('ts', '' + this.timeStamp.getTime(), url);
        }

        if (this.useOriginal) {
            url = this.appendParam(srcParams.useOriginalParamName, 'true', url);
        }
        else {
            if (forPreview) {
                if (this.size) {
                    url = this.appendParam('size', '' + this.size, url);
                }

                if (this.scaleWidth) {
                    url = this.appendParam('scaleWidth', 'true', url);
                }
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
