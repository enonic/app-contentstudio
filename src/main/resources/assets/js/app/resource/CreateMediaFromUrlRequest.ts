import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'createMediaFromUrl');
    }

    sendAndParse(): Q.Promise<Content> {

        return this.send().then((response: JsonResponse<ContentJson>) => {

            return this.fromJsonToContent(response.getResult());

        });
    }

}
