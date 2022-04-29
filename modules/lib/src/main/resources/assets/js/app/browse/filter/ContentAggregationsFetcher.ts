import {Aggregation} from 'lib-admin-ui/aggregation/Aggregation';
import {AggregationSelection} from 'lib-admin-ui/aggregation/AggregationSelection';
import {SearchInputValues} from 'lib-admin-ui/query/SearchInputValues';
import * as Q from 'q';
import {ContentQuery} from '../../content/ContentQuery';
import {SearchContentQueryCreator} from './SearchContentQueryCreator';
import {ContentQueryRequest} from '../../resource/ContentQueryRequest';
import {ContentSummaryJson} from '../../content/ContentSummaryJson';
import {ContentSummary} from '../../content/ContentSummary';
import {Expand} from 'lib-admin-ui/rest/Expand';
import {ContentQueryResult} from '../../resource/ContentQueryResult';
import {ContentId} from '../../content/ContentId';
import {BucketAggregation} from 'lib-admin-ui/aggregation/BucketAggregation';
import {ContentAggregations} from './ContentAggregations';
import {Bucket} from 'lib-admin-ui/aggregation/Bucket';
import {WorkflowState} from 'lib-admin-ui/content/WorkflowState';

export class ContentAggregationsFetcher {

    private readonly searchInputValues: SearchInputValues;
    private readonly contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>

    private dependency?: { isInbound: boolean, dependencyId: ContentId };
    private constraintItems?: string[];

    constructor(searchInputValues: SearchInputValues, contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) {
        this.searchInputValues = searchInputValues;
        this.contentQueryResult = contentQueryResult;
    }

    setDependency(value: { isInbound: boolean, dependencyId: ContentId }): ContentAggregationsFetcher {
        this.dependency = value;
        return this;
    }

    setConstraintItemsIds(value: string[]): ContentAggregationsFetcher {
        this.constraintItems = value;
        return this;
    }

    // if some of the aggregation's buckets were selected then we have to make a request like none of the aggregation's buckets selected
    // that will give us all the aggregation's buckets with numbers
    getAggregations(): Q.Promise<Aggregation[]> {
        const result: Aggregation[] = [];
        const selectedAggregationPromises: Q.Promise<Aggregation>[] = [];

        this.contentQueryResult.getAggregations().forEach((aggregation: Aggregation) => {
            const hasBucketsSelected: boolean = this.hasBucketsSelected(aggregation);

            if (hasBucketsSelected) {
                selectedAggregationPromises.push(this.fetchAggregation(aggregation).then((fetchedAggregation: Aggregation) => {
                    result.push(fetchedAggregation);
                    return Q.resolve(null);
                }));
            } else {
                if (aggregation.getName() === ContentAggregations.WORKFLOW) {
                    this.updateWorkflowAggregation(<BucketAggregation>aggregation, this.contentQueryResult.getMetadata().getTotalHits());
                }

                result.push(aggregation);
            }
        });

        return Q.all(selectedAggregationPromises).thenResolve(result);
    }

    private hasBucketsSelected(aggregation: Aggregation): boolean {
        return this.searchInputValues.aggregationSelections.some(
            (aggregationSelection: AggregationSelection) => aggregation.getName() === aggregationSelection.getName() &&
                                                            aggregationSelection.getSelectedBuckets().length > 0);
    }

    private fetchAggregation(aggregation: Aggregation): Q.Promise<Aggregation> {
        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(this.createAggregationQuery(aggregation))
            .setExpand(Expand.SUMMARY)
            .sendAndParse()
            .then((queryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                const fetchedAggregation: Aggregation =
                    queryResult.getAggregations().find((aggr: Aggregation) => aggr.getName() === aggregation.getName());

                if (fetchedAggregation.getName() === ContentAggregations.WORKFLOW) {
                    this.updateWorkflowAggregation(<BucketAggregation>fetchedAggregation, queryResult.getMetadata().getTotalHits());
                }

                return fetchedAggregation;
            });
    }

    private createAggregationQuery(aggregation: Aggregation): ContentQuery {
        const searchValuesNoAggregation: SearchInputValues = new SearchInputValues();
        searchValuesNoAggregation.setTextSearchFieldValue(this.searchInputValues.textSearchFieldValue);
        searchValuesNoAggregation.setAggregationSelections(this.copyAggregationsWithoutAggregation(aggregation));

        const searchContentQueryCreator: SearchContentQueryCreator = new SearchContentQueryCreator(searchValuesNoAggregation);
        searchContentQueryCreator.setIsAggregation(true);
        searchContentQueryCreator.setDependency(this.dependency);
        searchContentQueryCreator.setConstraintItemsIds(this.constraintItems);

        return searchContentQueryCreator.create();
    }

    private copyAggregationsWithoutAggregation(aggregation: Aggregation): AggregationSelection[] {
        const aggregationSelect: AggregationSelection[] = this.searchInputValues.aggregationSelections.filter(
            (aggrSelection: AggregationSelection) => aggrSelection.getName() !== aggregation.getName());

        const emptyAggregationSelection: AggregationSelection = new AggregationSelection(aggregation.getName())
        emptyAggregationSelection.setValues([]);
        aggregationSelect.push(emptyAggregationSelection);

        return aggregationSelect;
    }

    private updateWorkflowAggregation(aggregation: BucketAggregation, total: number): void {
        // contents might not have a workflow property, thus aggregation won't see those contents, but they are treated as ready
        const inProgressBucket: Bucket = aggregation.getBucketByName(WorkflowState.IN_PROGRESS);
        const result: Bucket[] = [];

        const inProgressCount: number = inProgressBucket?.docCount || 0;
        const readyCount: number = total - inProgressCount;

        if (readyCount > 0) {
            const bucket: Bucket = new Bucket(WorkflowState.READY, readyCount);
            result.push(bucket);
        }

        if (inProgressBucket) {
            result.push(inProgressBucket);
        }

        aggregation.setBuckets(result);
    }
}
