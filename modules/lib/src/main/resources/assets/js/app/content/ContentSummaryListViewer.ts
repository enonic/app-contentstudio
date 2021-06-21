import * as Q from 'q';
import {ContentSummaryAndCompareStatusViewer} from './ContentSummaryAndCompareStatusViewer';
import {ContentSummaryAndCompareStatus} from './ContentSummaryAndCompareStatus';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {Request} from 'lib-admin-ui/rest/Request';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {Path} from 'lib-admin-ui/rest/Path';
import {Response} from 'lib-admin-ui/rest/Response';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ImgEl} from 'lib-admin-ui/dom/ImgEl';

export class ContentSummaryListViewer
    extends ContentSummaryAndCompareStatusViewer {

    resolveDisplayName(object: ContentSummaryAndCompareStatus): string {
        if (object.hasContentSummary()) {
            return object.getContentSummary().getListTitle();
        }

        return super.resolveDisplayName(object);
    }

    doLayout(object: ContentSummaryAndCompareStatus) {
        super.doLayout(object);

        if (object.getType().isImage()) {
            this.namesAndIconView?.getIconImageEl().getEl().setSrc(ImgEl.PLACEHOLDER);
        }
    }

    resolveIconUrl(object: ContentSummaryAndCompareStatus): string {
        if (object.getType().isImage()) {
            this.checkAndSetImageUrlAsync(object);
            return null;
        }

        return super.resolveIconUrl(object);
    }

    private checkAndSetImageUrlAsync(object: ContentSummaryAndCompareStatus) {
        const url: string = super.resolveIconUrl(object);

        if (!StringHelper.isBlank(url)) {
            this.sendImageRequest(url);
        }
    }

    private sendImageRequest(url: string) {
        const request: ImageRequest = new ImageRequest(url);

        request.sendAndGet().then((imageResponse: ImageResponse) => {
            this.handleImageResponse(imageResponse);
        }).catch(DefaultErrorHandler.handle);
    }

    private handleImageResponse(imageResponse: ImageResponse) {
        if (imageResponse.status === 200) {
            this.handleUrlEncodedImage(imageResponse.imageAsUrl);
        } else {
            this.handleImageLoadError();
        }
    }

    private handleUrlEncodedImage(url: string) {
        const el: HTMLElement = document.getElementById(this.namesAndIconView.getId());
        if (el) {
            el.classList.remove('no-icon');
            el.getElementsByTagName('img')[0]?.setAttribute('src', url);
            el.getElementsByTagName('img')[0]?.style.removeProperty('display');
        }
    }

    private handleImageLoadError(code?: number) {
        //
    }
}

class ImageRequest
    extends Request {

    private readonly url: string;

    private static cachedRequestsPromises: Map<string, Q.Promise<ImageResponse>> = new Map<string, Q.Promise<ImageResponse>>();

    constructor(url: string) {
        super(HttpMethod.GET);

        this.url = url;
        this.setPath(Path.fromString(url));
    }

    protected createRequestURI(): string {
        return UriHelper.getUri(this.path.toString());
    }

    getRequestStatus(): number {
        return this.request.status;
    }

    sendAndGet(): Q.Promise<ImageResponse> {
        if (ImageRequest.cachedRequestsPromises.has(this.url)) {
            return ImageRequest.cachedRequestsPromises.get(this.url);
        }

        const requestPromise: Q.Promise<ImageResponse> = this.doSend();

        ImageRequest.cachedRequestsPromises.set(this.url, requestPromise);

        return requestPromise;
    }

    protected prepareRequest(): void {
        super.prepareRequest();
        this.request.responseType = 'blob';
    }

    private doSend(): Q.Promise<ImageResponse> {
        return this.send().then((response: Response) => {
            return this.request.status === 200 ? this.encodeImageAsURL(response) : Q({status: this.request.status});
        }).catch((reason: any) => {
            return Q({error: reason});
        });
    }

    private encodeImageAsURL(response: Response): Q.Promise<ImageResponse> {
        const deferred: Q.Deferred<ImageResponse> = Q.defer<ImageResponse>();

        const reader: FileReader = new FileReader();

        reader.onload = () => {
            deferred.resolve({status: this.getRequestStatus(), imageAsUrl: <string>reader.result});
        };

        try {
            reader.readAsDataURL(<any>response);
        } catch (e) {
            deferred.reject(e);
        }

        return deferred.promise;
    }
}

interface ImageResponse {

    status?: number;

    imageAsUrl?: string;

    error?: any;

}
