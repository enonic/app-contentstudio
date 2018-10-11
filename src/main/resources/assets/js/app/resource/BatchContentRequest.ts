import ContentSummaryJson = api.content.json.ContentSummaryJson;
import ContentSummary = api.content.ContentSummary;
import ContentPath = api.content.ContentPath;
import ContentMetadata = api.content.ContentMetadata;
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentResponse} from './ContentResponse';
import {ListContentResult} from './ListContentResult';

export class BatchContentRequest
    extends ContentResourceRequest<ListContentResult<ContentSummaryJson>, ContentResponse<ContentSummary>> {

    private contentPaths: ContentPath[] = [];

    constructor(contentPath?: ContentPath) {
        super();
        super.setMethod('POST');
        if (contentPath) {
            this.addContentPath(contentPath);
        }
    }

    setContentPaths(contentPaths: ContentPath[]): BatchContentRequest {
        this.contentPaths = contentPaths;
        return this;
    }

    addContentPath(contentPath: ContentPath): BatchContentRequest {
        this.contentPaths.push(contentPath);
        return this;
    }

    getParams(): Object {
        let fn = (contentPath: ContentPath) => {
            return contentPath.toString();
        };
        return {
            contentPaths: this.contentPaths.map(fn)
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'batch');
    }

    sendAndParse(): wemQ.Promise<ContentResponse<ContentSummary>> {

        return this.send().then((response: api.rest.JsonResponse<ListContentResult<api.content.json.ContentSummaryJson>>) => {
            return new ContentResponse(
                ContentSummary.fromJsonArray(response.getResult().contents),
                new ContentMetadata(response.getResult().metadata['hits'], response.getResult().metadata['totalHits'])
            );
        });
    }
}
