import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class CreateMediaFromUrlRequest
    extends CmsContentResourceRequest<Content> {

    private url: string;

    private name: string;

    private parent: string;

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('createMediaFromUrl');
    }

    setUrl(url: string): CreateMediaFromUrlRequest {
        this.url = url;
        return this;
    }

    setName(name: string): CreateMediaFromUrlRequest {
        this.name = name;
        return this;
    }

    setParent(parent: string): CreateMediaFromUrlRequest {
        this.parent = parent;
        return this;
    }

    getParams(): object {
        return {
            url: this.url,
            name: this.name,
            parent: this.parent ? this.parent : ''
        };
    }

    protected parseResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }

}
