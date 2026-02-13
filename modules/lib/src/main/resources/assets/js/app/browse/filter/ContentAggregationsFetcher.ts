import {type Aggregation} from '@enonic/lib-admin-ui/aggregation/Aggregation';
import {AggregationSelection} from '@enonic/lib-admin-ui/aggregation/AggregationSelection';
import {SearchInputValues} from '@enonic/lib-admin-ui/query/SearchInputValues';
import Q from 'q';
import {type ContentQuery} from '../../content/ContentQuery';
import {SearchContentQueryCreator} from './SearchContentQueryCreator';
import {ContentQueryRequest} from '../../resource/ContentQueryRequest';
import {type ContentSummaryJson} from '../../content/ContentSummaryJson';
import {type ContentSummary} from '../../content/ContentSummary';
import {Expand} from '@enonic/lib-admin-ui/rest/Expand';
import {type ContentQueryResult} from '../../resource/ContentQueryResult';
import {type ContentId} from '../../content/ContentId';
import {type BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {ContentAggregation} from './ContentAggregation';
import {type Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {WorkflowState} from '../../content/WorkflowState';
import {AggregationsQueryResult} from './AggregationsQueryResult';
import {ContentResourceRequest} from '../../resource/ContentResourceRequest';
import {type Branch} from '../../versioning/Branch';

export class ContentAggregationsFetcher {

    private searchInputValues: SearchInputValues;
    private dependency?: { isInbound: boolean, dependencyId: ContentId };
    private constraintItems?: string[];
    private rootPath?: string;
    private targetBranch?: Branch;
    private readonly aggregationsNames: string[];

    constructor(aggregationsNames?: string[]) {
        this.aggregationsNames = aggregationsNames;
    }

    setSearchInputValues(searchInputValues: SearchInputValues): ContentAggregationsFetcher {
        this.searchInputValues = searchInputValues;
        return this;
    }

    setDependency(value: { isInbound: boolean, dependencyId: ContentId }): ContentAggregationsFetcher {
        this.dependency = value;
        return this;
    }

    setTargetBranch(value: Branch): ContentAggregationsFetcher {
        this.targetBranch = value;
        return this;
    }

    setConstraintItemsIds(value: string[]): ContentAggregationsFetcher {
        this.constraintItems = value;
        return this;
    }

    setRootPath(value: string): ContentAggregationsFetcher {
        this.rootPath = value;
        return this;
    }

    // if some of the aggregation's buckets were selected then we have to make a request like none of the aggregation's buckets selected
    // that will give us all the aggregation's buckets with numbers
    getAggregations(): Q.Promise<AggregationsQueryResult> {
        const result: Aggregation[] = [];
        const selectedAggregationPromises: Q.Promise<Aggregation>[] = [];

        return this.sendQueryRequest(this.createContentQuery(this.searchInputValues).setSize(0)).then(
            (queryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                queryResult.getAggregations().forEach((aggregation: Aggregation) => {
                    const hasBucketsSelected: boolean = this.hasBucketsSelected(aggregation);

                    if (hasBucketsSelected) {
                        selectedAggregationPromises.push(this.fetchAggregation(aggregation).then((fetchedAggregation: Aggregation) => {
                            result.push(fetchedAggregation);
                            return Q.resolve(null);
                        }));
                    } else {
                        if (aggregation.getName() === ContentAggregation.WORKFLOW.toString()) {
                            this.updateWorkflowAggregation(aggregation as BucketAggregation, queryResult.getMetadata().getTotalHits());
                        }

                        result.push(aggregation);
                    }
                });

                return Q.all(selectedAggregationPromises).thenResolve(new AggregationsQueryResult(result, queryResult.getMetadata()));
            });
    }

    private hasBucketsSelected(aggregation: Aggregation): boolean {
        return this.searchInputValues.aggregationSelections.some(
            (aggregationSelection: AggregationSelection) => aggregation.getName() === aggregationSelection.getName() &&
                                                            aggregationSelection.getSelectedBuckets().length > 0);
    }

    private fetchAggregation(aggregation: Aggregation): Q.Promise<Aggregation> {
        return this.sendQueryRequest(this.createAggregationQuery(aggregation))
            .then((queryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                const fetchedAggregation: Aggregation =
                    queryResult.getAggregations().find((aggr: Aggregation) => aggr.getName() === aggregation.getName());

                if (fetchedAggregation.getName() === ContentAggregation.WORKFLOW.toString()) {
                    this.updateWorkflowAggregation(fetchedAggregation as BucketAggregation, queryResult.getMetadata().getTotalHits());
                }

                return fetchedAggregation;
            });
    }

    private sendQueryRequest(query: ContentQuery, expand?: Expand): Q.Promise<ContentQueryResult<ContentSummary, ContentSummaryJson>> {
        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(query)
            .setContentRootPath(this.rootPath || ContentResourceRequest.CONTENT_PATH)
            .setExpand(expand ?? Expand.NONE)
            .setTargetBranch(this.targetBranch)
            .sendAndParse();
    }

    private createAggregationQuery(aggregation: Aggregation): ContentQuery {
        const searchValuesNoAggregation: SearchInputValues = new SearchInputValues();
        searchValuesNoAggregation.setTextSearchFieldValue(this.searchInputValues.textSearchFieldValue);
        searchValuesNoAggregation.setAggregationSelections(this.copyAggregationsWithoutAggregation(aggregation));

        return this.createContentQuery(searchValuesNoAggregation).setSize(0);
    }

    createContentQuery(searchInputValues: SearchInputValues): ContentQuery {
        const searchContentQueryCreator: SearchContentQueryCreator = this.getContentQueryCreator(searchInputValues);

        searchContentQueryCreator.setDependency(this.dependency);
        searchContentQueryCreator.setConstraintItemsIds(this.constraintItems);

        return searchContentQueryCreator.create(this.aggregationsNames);
    }

    private copyAggregationsWithoutAggregation(aggregation: Aggregation): AggregationSelection[] {
        const aggregationSelect: AggregationSelection[] = this.searchInputValues.aggregationSelections.filter(
            (aggrSelection: AggregationSelection) => aggrSelection.getName() !== aggregation.getName());

        const emptyAggregationSelection: AggregationSelection = new AggregationSelection(aggregation.getName());
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

        // skipping for now because published items are also ending up in this bucket
        // if (readyCount > 0) {
        //     const readyBucket: Bucket = new Bucket(WorkflowState.READY, readyCount);
        //     result.push(readyBucket);
        // }

        if (inProgressBucket) {
            result.push(inProgressBucket);
        }

        aggregation.setBuckets(result);
    }

    protected getContentQueryCreator(searchInputValues: SearchInputValues): SearchContentQueryCreator {
        return new SearchContentQueryCreator(searchInputValues);
    }
}
