import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';

export class CreateMediaFromUrlRequest
    extends ContentResourceRequest<ContentJson, Content> {

    private url: string;

    private name: string;

    private parent: string;

    constructor() {
        super();
        super.setMethod('POST');
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

    getParams(): Object {
        return {
            url: this.url,
            name: this.name,
            parent: this.parent ? this.parent : ''
        };
    }

    protected processResponse(response: JsonResponse<ContentJson>): Content {
        return this.fromJsonToContent(response.getResult());
    }

}
