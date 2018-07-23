import ContentSummaryJson = api.content.json.ContentSummaryJson;
import ContentResourceRequest = api.content.resource.ContentResourceRequest;
import ContentSummary = api.content.ContentSummary;

export class GetContentSummaryByIdRequest
    extends ContentResourceRequest<ContentSummaryJson, ContentSummary> {

    private id: ContentId;

    private expand: string;

    constructor(id: ContentId) {
        super();
        super.setMethod('GET');
        this.id = id;
        this.expand = ContentResourceRequest.EXPAND_SUMMARY;
    }

    getParams(): Object {
        return {
            id: this.id.toString(),
            expand: this.expand
        };
    }

    getRequestPath(): api.rest.Path {
        return super.getResourcePath();
    }

    sendAndParse(): wemQ.Promise<ContentSummary> {

        return this.send().then((response: api.rest.JsonResponse<ContentSummaryJson>) => {
            return this.fromJsonToContentSummary(response.getResult());
        });
    }
}
