import {StyleJson} from './StylesDescriptor';
import {Styles} from './Styles';
declare var CONFIG;

export interface GetStylesResponse {
    css: string[];
    styles: StyleJson[];
}

export class StylesRequest
    extends api.rest.ResourceRequest<GetStylesResponse, Styles> {

    private static loadingContentId: string;

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
        if (!!StylesRequest.loadingContentId && StylesRequest.loadingContentId === this.contentId) {
            // Avoid sending multiple requests for the same contentId,
            // for example when there are several HTML Area inputs on the same page
            return wemQ(null);
        }
        StylesRequest.loadingContentId = this.contentId;
        return this.send().then((response: api.rest.JsonResponse<GetStylesResponse>) => {
            StylesRequest.loadingContentId = null;
            return this.fromJson(response.getResult());
        });
    }

    private fromJson(json: GetStylesResponse): Styles {
        return new Styles(json);
    }
}
