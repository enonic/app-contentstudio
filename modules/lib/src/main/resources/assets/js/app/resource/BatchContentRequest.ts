import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentResponse} from './ContentResponse';
import {ListContentResult} from './ListContentResult';
import {ResultMetadata} from './ResultMetadata';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentSummary} from '../content/ContentSummary';
import {ContentSummaryJson} from '../content/ContentSummaryJson';
import {ContentPath} from '../content/ContentPath';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class BatchContentRequest
    extends CmsContentResourceRequest<ContentResponse<ContentSummary>> {

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
            ResultMetadata.fromJson(response.getResult().metadata),
        );
    }
}
