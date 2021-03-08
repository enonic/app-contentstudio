import {ContentId} from 'lib-admin-ui/content/ContentId';
import {IconUrlResolver} from 'lib-admin-ui/icon/IconUrlResolver';
import {StyleHelper} from '../inputtype/ui/text/styles/StyleHelper';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {UrlHelper} from './UrlHelper';

export class ImageUrlResolver
    extends IconUrlResolver {

    static readonly URL_PREFIX_PREVIEW: string = 'content/image/';
    static readonly URL_PREFIX_RENDER: string = 'image://';
    static readonly URL_PREFIX_RENDER_ORIGINAL: string = 'media://';
    static readonly DEFAULT_IMAGE_SIZE: number = 768;

    private contentId: ContentId;

    private timeStamp: Date;

    private source: boolean = false;

    private crop: boolean = true;

    private scaleWidth: boolean = false;

    private size: number;

    private aspectRatio: string; //scale params applied to image

    private filter: string;

    setContentId(value: ContentId): ImageUrlResolver {
        this.contentId = value;
        return this;
    }

    setSize(value: number): ImageUrlResolver {
        this.size = Math.floor(value);
        return this;
    }

    setDefaultSize(): ImageUrlResolver {
        this.size = ImageUrlResolver.DEFAULT_IMAGE_SIZE;
        return this;
    }

    setTimestamp(value: Date): ImageUrlResolver {
        this.timeStamp = value;
        return this;
    }

    disableCropping(): ImageUrlResolver {
        this.crop = false;
        return this;
    }

    disableProcessing(): ImageUrlResolver {
        this.source = true;
        this.scaleWidth = false;
        return this;
    }

    setAspectRatio(value: string): ImageUrlResolver {
        this.aspectRatio = value;
        return this;
    }

    setFilter(value: string): ImageUrlResolver {
        this.filter = value;
        return this;
    }

    setScaleWidth(value: boolean) : ImageUrlResolver {
        this.scaleWidth = value;
        return this;
    }

    private getBaseUrl(urlPrefix: string, isAbsoluteUrl: boolean): string {
        const url = `${urlPrefix}${this.contentId.toString()}`;

        return isAbsoluteUrl ? UriHelper.getRestUri(url) : url;
    }

    resolveForRender(styleName: string = ''): string {
        const isOriginalImageStyle: boolean = StyleHelper.isOriginalImage(styleName);
        const urlPrefix: string = isOriginalImageStyle ? ImageUrlResolver.URL_PREFIX_RENDER_ORIGINAL : ImageUrlResolver.URL_PREFIX_RENDER;
        const url: string = this.getBaseUrl(urlPrefix, false);

        return (isOriginalImageStyle || !styleName) ? url : `${url}?style=${styleName}`;
    }

    resolveForPreview(): string {
        let url = this.getBaseUrl(`${UrlHelper.getCMSPath()}/${ImageUrlResolver.URL_PREFIX_PREVIEW}`, true);

        if (this.timeStamp) {
            url = this.appendParam('ts', '' + this.timeStamp.getTime(), url);
        }

        if (this.size) {
            url = this.appendParam('size', '' + Math.floor(this.size), url);
        }

        if (this.source) {
            url = this.appendParam('source', 'true', url);
        }

        if (this.aspectRatio) {
            url = this.appendParam('scale', this.aspectRatio, url);
        }

        if (this.filter) {
            url = this.appendParam('filter', this.filter, url);
        }

        if (!this.crop) {
            url = this.appendParam('crop', 'false', url);
        }

        if (this.scaleWidth) {
            url = this.appendParam('scaleWidth', 'true', url);
        }

        return url;
    }
}
