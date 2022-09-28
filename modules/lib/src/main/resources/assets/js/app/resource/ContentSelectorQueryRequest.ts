import * as Q from 'q';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentSelectorRequest} from './ContentSelectorRequest';
import {ContentQueryResultJson} from './json/ContentQueryResultJson';
import {ContentJson} from '../content/ContentJson';
import {Expand} from '@enonic/lib-admin-ui/rest/Expand';
import {ContentSummary} from '../content/ContentSummary';
import {ContentSummaryJson} from '../content/ContentSummaryJson';
import {ResultMetadata} from './ResultMetadata';

export class ContentSelectorQueryRequest<CONTENT_JSON extends ContentSummaryJson, CONTENT extends ContentSummary>
    extends ContentSelectorRequest<CONTENT> {

    private loadingFrom: number;

    protected size: number = 15;

    private metadata: ResultMetadata;

    constructor() {
        super();

        this.addRequestPathElements('selectorQuery');
    }

    static createEmptyResponse(): ContentQueryResultJson<ContentSummaryJson> {
        return {
            aggregations: [],
            contents: [],
            metadata: {
                hits: 0,
                totalHits: 0,
            }
        };
    }

    send(): Q.Promise<JsonResponse<ContentQueryResultJson<CONTENT_JSON>>> {
        return super.send().catch(() => {
            const data = JSON.stringify(ContentSelectorQueryRequest.createEmptyResponse());
            return new JsonResponse<ContentQueryResultJson<CONTENT_JSON>>(data);
        });
    }

    sendAndParse(): Q.Promise<CONTENT[]> {
        if (this.isConcurrentLoad()) {
            return Q(this.results);
        }

        this.loadingFrom = this.from;

        return super.sendAndParse();
    }

    private isConcurrentLoad() {
        return this.from === this.loadingFrom;
    }

    getMetadata(): ResultMetadata {
        return this.metadata;
    }

    protected parseResponse(response: JsonResponse<ContentQueryResultJson<CONTENT_JSON>>): CONTENT[] {
        const responseResult: ContentQueryResultJson<CONTENT_JSON> = response.getResult();

        this.metadata = ResultMetadata.fromJson(response.getResult().metadata);

        const contentsAsJson: ContentSummaryJson[] = responseResult.contents;

        let contents: CONTENT[];

        if (this.getExpand() === Expand.SUMMARY) {
            contents = <any[]>this.fromJsonToContentSummaryArray(contentsAsJson);
        } else {
            contents = <any[]>this.fromJsonToContentArray(<ContentJson[]>contentsAsJson);
        }

        if (this.from === 0) {
            this.results = [];
        }
        this.loadingFrom = undefined;
        this.from += responseResult.metadata.hits;
        this.loaded = this.from >= responseResult.metadata.totalHits;

        this.results = this.results.concat(contents);

        return this.results;
    }
}
