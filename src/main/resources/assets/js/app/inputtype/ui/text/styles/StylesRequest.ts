import {StyleJson} from './StylesDescriptor';
import {Styles} from './Styles';
declare var CONFIG;

export interface GetStylesResponse {
    css: string[];
    styles: StyleJson[];
}

export class StylesRequest
    extends api.rest.ResourceRequest<GetStylesResponse, Styles> {

    private contentId: string;

    constructor(contentId: string) {
        super();
        super.setMethod('POST');

        this.contentId = contentId;
    }

    getRequestPath(): api.rest.Path {
        return CONFIG.stylesUrl;
    }

    getParams(): Object {
        return {
            contentId: this.contentId
        };
    }

    sendAndParse(): wemQ.Promise<Styles> {
        return this.send().then((response: api.rest.JsonResponse<GetStylesResponse>) => {
            return this.fromJson(response.getResult());
        });
    }

    private fromJson(json: GetStylesResponse): Styles {
        return new Styles(json);
    }
}
