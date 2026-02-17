import Q from 'q';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ContentSelectorRequest} from './ContentSelectorRequest';
import {type ContentQueryResultJson} from './json/ContentQueryResultJson';
import {type ContentJson} from '../content/ContentJson';
import {Expand} from '@enonic/lib-admin-ui/rest/Expand';
import {type ContentSummary} from '../content/ContentSummary';
import {type ContentSummaryJson} from '../content/ContentSummaryJson';
import {ResultMetadata} from './ResultMetadata';
import {type Content} from '../content/Content';

export class ContentSelectorQueryRequest<CONTENT_JSON extends ContentSummaryJson, CONTENT extends ContentSummary>
    extends ContentSelectorRequest<CONTENT> {

    private loadingFrom: number;

    protected size: number = 15;

    private metadata: ResultMetadata;

    private appendLoadResults: boolean = true;

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

    setAppendLoadResults(value: boolean): this {
        this.appendLoadResults = value;
        return this;
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

        let contents: (ContentSummary | Content)[];

        if (this.getExpand() === Expand.SUMMARY) {
            contents = this.fromJsonToContentSummaryArray(contentsAsJson);
        } else {
            contents = this.fromJsonToContentArray(contentsAsJson as ContentJson[]) as ContentSummary[];
        }

        if (this.from === 0) {
            this.results = [];
        }
        this.loadingFrom = undefined;
        this.from += responseResult.metadata.hits;
        this.loaded = this.from >= responseResult.metadata.totalHits;

        this.results = this.appendLoadResults ? this.results.concat(contents as CONTENT[]) : contents as CONTENT[];

        return this.results;
    }
}
