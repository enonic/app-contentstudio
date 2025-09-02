import {Aggregation} from '@enonic/lib-admin-ui/aggregation/Aggregation';
import {AggregationGroupView} from '@enonic/lib-admin-ui/aggregation/AggregationGroupView';
import {AggregationView} from '@enonic/lib-admin-ui/aggregation/AggregationView';
import {Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {FilterableBucketAggregationView} from './FilterableBucketAggregationView';
import {AggregationsDisplayNamesResolver} from './AggregationsDisplayNamesResolver';

export class FilterableAggregationGroupView
    extends AggregationGroupView {

    private idsToKeepOnToTop: string[];

    private resolver: AggregationsDisplayNamesResolver;

    protected createAggregationView(aggregation: Aggregation): AggregationView {
        const aggregationView: FilterableBucketAggregationView = new FilterableBucketAggregationView(aggregation as BucketAggregation);

        aggregationView.onBucketSelectionChanged((bucketSelection: SelectionChange<Bucket>) =>
            this.notifyBucketViewSelectionChanged(bucketSelection)
        );

        aggregationView.setResolver(this.resolver);
        aggregationView.setIdsToKeepOnToTop(this.idsToKeepOnToTop);

        return aggregationView;
    }

    setIdsToKeepOnToTop(ids: string[]) {
        this.idsToKeepOnToTop = ids;

        this.aggregationViews.forEach((item: AggregationView) => {
            if (item instanceof FilterableBucketAggregationView) {
                item.setIdsToKeepOnToTop(ids);
            }
        });
    }

    setResolver(resolver: AggregationsDisplayNamesResolver) {
        this.resolver = resolver;
    }

}
