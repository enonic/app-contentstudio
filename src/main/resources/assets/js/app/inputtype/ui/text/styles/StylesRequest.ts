import {StyleJson} from './StylesDescriptor';
import {Styles} from './Styles';
declare var CONFIG;

export interface GetStylesResponse {
    css: string[];
    styles: StyleJson[];
}

export class StylesRequest
    extends api.rest.ResourceRequest<GetStylesResponse, Styles> {

    private static requests: { [key: string]:  wemQ.Promise<Styles>; } = {};

    private contentId: string;

    constructor(contentId: string) {
        super();

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
        if (StylesRequest.requests[this.contentId]) {
            // Avoid sending multiple requests for the same contentId,
            // for example when there are several HTML Area inputs on the same page
            return StylesRequest.requests[this.contentId];
        }
        StylesRequest.requests[this.contentId] = this.send().then((response: api.rest.JsonResponse<GetStylesResponse>) => {
            delete StylesRequest.requests[this.contentId];
            return this.fromJson(response.getResult());
        });

        return StylesRequest.requests[this.contentId];
    }

    private fromJson(json: GetStylesResponse): Styles {
        return new Styles(json);
    }
}
