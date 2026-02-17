import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';

export class AggregateContentTypesResult {

    private aggregations: ContentTypeAggregation[];

    constructor(aggregations: ContentTypeAggregation[] = []) {
        this.aggregations = aggregations;
    }

    addAggregation(aggregation: ContentTypeAggregation) {
        this.aggregations.push(aggregation);
    }

    getAggregations(): ContentTypeAggregation[] {
        return this.aggregations;
    }

}

export class ContentTypeAggregation {

    private contentType: ContentTypeName;

    private count: number;

    constructor(contentType: ContentTypeName, count: number) {
        this.contentType = contentType;
        this.count = count;
    }

    getContentType(): ContentTypeName {
        return this.contentType;
    }

    getCount(): number {
        return this.count;
    }
}
