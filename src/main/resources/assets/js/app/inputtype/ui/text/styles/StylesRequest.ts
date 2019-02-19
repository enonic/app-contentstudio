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

    static fetchStyles(contentId: string): wemQ.Promise<Styles> {

        const deferred = wemQ.defer<Styles>();

        if (Styles.getInstance(contentId)) {
            deferred.resolve(Styles.getInstance(contentId));

            return deferred.promise;
        }

        new StylesRequest(contentId).sendAndParse().then((styles: Styles) => deferred.resolve(styles));

        return deferred.promise;
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

        if (Styles.getInstance(this.contentId)) {
            // If styles are already fetched for this contentId,
            // return them without sending a new request
            const deferred = wemQ.defer<Styles>();
            deferred.resolve(Styles.getInstance(this.contentId));

            return deferred.promise;
        }

        StylesRequest.requests[this.contentId] = this.send().then((response: api.rest.JsonResponse<GetStylesResponse>) => {
            delete StylesRequest.requests[this.contentId];
            return this.fromJson(this.contentId, response.getResult());
        });

        return StylesRequest.requests[this.contentId];
    }

    private fromJson(contentId: string, json: GetStylesResponse): Styles {
        return new Styles(contentId, json);
    }
}
