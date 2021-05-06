import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentResponse} from './ContentResponse';
import {ListContentResult} from './ListContentResult';
import {ContentMetadata} from '../content/ContentMetadata';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ContentSummary} from '../content/ContentSummary';
import {ContentSummaryJson} from '../content/ContentSummaryJson';
import {ContentPath} from '../content/ContentPath';

export class BatchContentRequest
    extends ContentResourceRequest<ContentResponse<ContentSummary>> {

    private contentPaths: ContentPath[] = [];

    constructor(contentPath?: ContentPath) {
        super();
        this.setMethod(HttpMethod.POST);
        if (contentPath) {
            this.addContentPath(contentPath);
        }
        this.addRequestPathElements('batch');
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

    protected parseResponse(response: JsonResponse<ListContentResult<ContentSummaryJson>>): ContentResponse<ContentSummary> {
        return new ContentResponse(
            ContentSummary.fromJsonArray(response.getResult().contents),
            new ContentMetadata(response.getResult().metadata['hits'], response.getResult().metadata['totalHits'])
        );
    }
}
