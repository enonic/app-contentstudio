import * as Q from 'q';
import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {Response} from '@enonic/lib-admin-ui/rest/Response';
import {RequestError} from '@enonic/lib-admin-ui/rest/RequestError';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {UriHelper as RenderingUriHelper} from '../rendering/UriHelper';
import {RenderingMode} from '../rendering/RenderingMode';
import {ContentSummary} from '../content/ContentSummary';

export class IsRenderableRequest
    extends ResourceRequest<boolean> {

    private item: ContentSummary;

    private mode: RenderingMode;

    private static cache: Map<string, boolean> = new Map<string, boolean>();

    constructor(summary: ContentSummary, mode?: RenderingMode) {
        super();
        this.item = summary;
        this.mode = mode;
        this.setMethod(HttpMethod.HEAD);
        this.setIsJsonResponse(false);
    }

    static clearCache() {
        this.cache.clear();
    }

    getRequestPath(): Path {
        const url = RenderingUriHelper.getPortalUri(this.item.getPath()?.toString() || '', RenderingMode.INLINE);
        return Path.create().fromString(url).build();
    }

    protected parseResponse(response: Response): boolean {
        return true;
    }

    getParams(): Object {
        if (!this.mode) {
            return super.getParams();
        }

        return {
            mode: this.mode
        };
    }

    sendAndParse(): Q.Promise<boolean> {
        const id: string = this.item?.getId();

        if (id && IsRenderableRequest.cache.has(id)) {
            return Q(IsRenderableRequest.cache.get(id));
        }

        return super.sendAndParse().then((isRenderable: boolean) => {
            IsRenderableRequest.cache.set(id, isRenderable);
            return isRenderable;
        }).catch((error: RequestError) => {
            IsRenderableRequest.cache.set(id, false);
            return false;
        });
    }
}
