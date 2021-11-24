import {ResultMetadata} from './ResultMetadata';
import {Aggregation} from 'lib-admin-ui/aggregation/Aggregation';
import {ContentSummary} from '../content/ContentSummary';
import {ContentSummaryJson} from '../content/ContentSummaryJson';

export class ContentQueryResult<CONTENT extends ContentSummary, CONTENT_JSON extends ContentSummaryJson> {

    private contents: CONTENT[];
    private aggregations: Aggregation[];
    private contentsAsJson: CONTENT_JSON[];
    private metadata: ResultMetadata;

    constructor(
        contents: CONTENT[],
        aggreations: Aggregation[],
        contentsAsJson: CONTENT_JSON[],
        metadata?: ResultMetadata
    ) {
        this.contents = contents;
        this.aggregations = aggreations;
        this.contentsAsJson = contentsAsJson;
        this.metadata = metadata;
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
}
