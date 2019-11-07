import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentResponse} from './ContentResponse';
import {ListContentResult} from './ListContentResult';
import {ContentMetadata} from '../content/ContentMetadata';

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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'batch');
    }

    sendAndParse(): Q.Promise<ContentResponse<ContentSummary>> {

        return this.send().then((response: JsonResponse<ListContentResult<ContentSummaryJson>>) => {
            return new ContentResponse(
                ContentSummary.fromJsonArray(response.getResult().contents),
                new ContentMetadata(response.getResult().metadata['hits'], response.getResult().metadata['totalHits'])
            );
        });
    }
}
