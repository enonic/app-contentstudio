import * as Q from 'q';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentSelectorRequest} from './ContentSelectorRequest';
import {ContentQueryResultJson} from './json/ContentQueryResultJson';
import {ContentJson} from '../content/ContentJson';
import {Expand} from 'lib-admin-ui/rest/Expand';
import {ContentSummary} from '../content/ContentSummary';
import {ContentSummaryJson} from '../content/ContentSummaryJson';

export class ContentSelectorQueryRequest<CONTENT_JSON extends ContentSummaryJson, CONTENT extends ContentSummary>
    extends ContentSelectorRequest<CONTENT> {

    private loadingFrom: number;

    protected size: number = 15;

    constructor() {
        super();

        this.addRequestPathElements('selectorQuery');
    }

    sendAndParse(): Q.Promise<CONTENT[]> {
        if (this.isConcurrentLoad()) {
            return Q(this.results);
        }

        this.loadingFrom = this.from;

        return super.sendAndParse().catch(() => {
            return [];
        });
    }

    private isConcurrentLoad() {
        return this.from === this.loadingFrom;
    }

    protected parseResponse(response: JsonResponse<ContentQueryResultJson<CONTENT_JSON>>): CONTENT[] {
        const responseResult: ContentQueryResultJson<CONTENT_JSON> = response.getResult();

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
        this.from += responseResult.metadata['hits'];
        this.loaded = this.from >= responseResult.metadata['totalHits'];

        this.results = this.results.concat(contents);

        return this.results;
    }
}
