import * as Q from 'q';
import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {Response} from '@enonic/lib-admin-ui/rest/Response';
import {RequestError} from '@enonic/lib-admin-ui/rest/RequestError';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {UriHelper as RenderingUriHelper} from '../rendering/UriHelper';
import {RenderingMode} from '../rendering/RenderingMode';
import {ContentSummary} from '../content/ContentSummary';
import {AccessDeniedException} from '@enonic/lib-admin-ui/AccessDeniedException';

export class IsRenderableRequest
    extends ResourceRequest<number> {

    private item: ContentSummary;

    private readonly mode: RenderingMode;

    private static cache: Map<string, number | Q.Promise<number>> = new Map<string, number | Q.Promise<number>>();

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

    protected parseResponse(response: Response): number {
        return response.getStatus();
    }

    getParams(): object {
        if (!this.mode) {
            return super.getParams();
        }

        return {
            mode: this.mode
        };
    }

    sendAndParse(): Q.Promise<number> {
        const id: string = this.item?.getId();

        if (id && IsRenderableRequest.cache.has(id)) {
            const cachedIsRenderable = IsRenderableRequest.cache.get(id);
            if (typeof cachedIsRenderable === 'number') {
                return Q(cachedIsRenderable);
            }

            return cachedIsRenderable;
        }

        const request = super.sendAndParse().then((statusCode: number) => {
            if (id) {
                IsRenderableRequest.cache.set(id, statusCode);
            }
            return statusCode;
        }).catch((error: RequestError | AccessDeniedException) => {
            let statusCode = 500;
            if (error instanceof RequestError) {
                statusCode = error.getStatusCode();
            }
            if (error instanceof AccessDeniedException) {
                statusCode = 403;
            }

            if (id) {
                IsRenderableRequest.cache.set(id, statusCode);
            }
            return statusCode;
        });

        if (id && !IsRenderableRequest.cache.has(id)) {
            IsRenderableRequest.cache.set(id, request);
        }

        return request;
    }
}
