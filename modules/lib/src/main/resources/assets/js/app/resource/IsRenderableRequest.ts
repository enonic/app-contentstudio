import * as Q from 'q';
import {PageTemplateResourceRequest} from './PageTemplateResourceRequest';
import {ContentId} from '../content/ContentId';

export class IsRenderableRequest
    extends PageTemplateResourceRequest<boolean> {

    private contentId: ContentId;

    private static cache: Map<string, boolean> = new Map<string, boolean>();

    constructor(contentId: ContentId) {
        super();
        this.contentId = contentId;
        this.addRequestPathElements('isRenderable');
    }

    static clearCache() {
        this.cache.clear();
    }

    setContentId(value: ContentId): IsRenderableRequest {
        this.contentId = value;
        return this;
    }

    getParams(): Object {
        return {
            contentId: this.contentId.toString()
        };
    }

    sendAndParse(): Q.Promise<boolean> {
        const id: string = this.contentId.toString();

        if (IsRenderableRequest.cache.has(id)) {
            return Q(IsRenderableRequest.cache.get(id));
        }

        return super.sendAndParse().then((isRenderable: boolean) => {
            IsRenderableRequest.cache.set(id, isRenderable);
            return isRenderable;
        });
    }
}
