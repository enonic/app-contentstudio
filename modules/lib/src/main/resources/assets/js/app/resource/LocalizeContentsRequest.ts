import * as Q from 'q';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ListContentResult} from './ListContentResult';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentSummary} from '../content/ContentSummary';
import {ContentId} from '../content/ContentId';
import {ContentSummaryJson} from '../content/ContentSummaryJson';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';

export class LocalizeContentsRequest
    extends CmsContentResourceRequest<ContentSummary[]> {

    private readonly ids: ContentId[];

    private readonly language: string;

    constructor(ids: ContentId[], language: string) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = ids;
        this.language = language;
        this.addRequestPathElements('localize');
    }

    getParams(): Object {
        return {
            contentIds: this.ids.map(id => id.toString()),
            language: this.language
        };
    }

    sendAndParse(): Q.Promise<ContentSummary[]> {
        if (this.ids?.length > 0 && this.language) {
            return super.sendAndParse();
        }

        return Q([]);
    }

    protected parseResponse(response: JsonResponse<ListContentResult<ContentSummaryJson>>): ContentSummary[] {
        return ContentSummary.fromJsonArray(response.getResult().contents);
    }

}
