import {ResultMetadata} from './ResultMetadata';
import {Aggregation} from 'lib-admin-ui/aggregation/Aggregation';
import {ContentSummary} from '../content/ContentSummary';
import {ContentSummaryJson} from '../content/ContentSummaryJson';
import {CompareStatus} from '../content/CompareStatus';

export class ContentQueryResult<CONTENT extends ContentSummary, CONTENT_JSON extends ContentSummaryJson> {

    private contents: CONTENT[];
    private aggregations: Aggregation[];
    private contentsAsJson: CONTENT_JSON[];
    private metadata: ResultMetadata;
    private statuses: Map<CompareStatus, number>;

    constructor(
        contents: CONTENT[],
        aggreations: Aggregation[],
        contentsAsJson: CONTENT_JSON[],
        metadata: ResultMetadata,
        statuses: Map<CompareStatus, number>
    ) {
        this.contents = contents;
        this.aggregations = aggreations;
        this.contentsAsJson = contentsAsJson;
        this.metadata = metadata;
        this.statuses = statuses;
    }

    getContents(): CONTENT[] {
        return this.contents;
    }

    getContentsAsJson(): CONTENT_JSON[] {
        return this.contentsAsJson;
    }

    getAggregations(): Aggregation[] {
        return this.aggregations;
    }

    getMetadata(): ResultMetadata {
        return this.metadata;
    }

    getStatuses(): Map<CompareStatus, number> {
        return this.statuses;
    }
}
