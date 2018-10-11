import {ContentMetadata} from '../content/ContentMetadata';
import ContentSummary = api.content.ContentSummary;
import ContentSummaryJson = api.content.json.ContentSummaryJson;

export class ContentQueryResult<CONTENT extends ContentSummary, CONTENT_JSON extends ContentSummaryJson> {

    private contents: CONTENT[];
    private aggregations: api.aggregation.Aggregation[];
    private contentsAsJson: CONTENT_JSON[];
    private metadata: ContentMetadata;

    constructor(
        contents: CONTENT[],
        aggreations: api.aggregation.Aggregation[],
        contentsAsJson: CONTENT_JSON[],
        metadata?: ContentMetadata
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

    getAggregations(): api.aggregation.Aggregation[] {
        return this.aggregations;
    }

    getMetadata(): ContentMetadata {
        return this.metadata;
    }
}
