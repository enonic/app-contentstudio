import {AggregationGroupView} from '@enonic/lib-admin-ui/aggregation/AggregationGroupView';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {BucketAggregationView} from '@enonic/lib-admin-ui/ui2/BucketAggregationView';
import {AggregationsDisplayNamesResolver} from './AggregationsDisplayNamesResolver';

export class FilterableAggregationGroupView
    extends AggregationGroupView {

    private idsToKeepOnToTop: string[];

    private resolver: AggregationsDisplayNamesResolver;

    protected createAggregationView(aggregation: BucketAggregation): BucketAggregationView {
        //const aggregationView: FilterableBucketAggregationView = new FilterableBucketAggregationView((aggregation as BucketAggregation));

        // aggregationView.onBucketSelectionChanged((bucketSelection: SelectionChange<Bucket>) =>
        //     this.notifyBucketViewSelectionChanged(bucketSelection)
        // );

        //aggregationView.setResolver(this.resolver);
        //aggregationView.setIdsToKeepOnToTop(this.idsToKeepOnToTop);

       return new BucketAggregationView(aggregation);
    }

    setIdsToKeepOnToTop(ids: string[]) {
        this.idsToKeepOnToTop = ids;

        this.aggregationViews.forEach((item: BucketAggregationView) => {
          //   if (item instanceof FilterableBucketAggregationView) {
          // //      item.setIdsToKeepOnToTop(ids);
          //   }
        });
    }

    setResolver(resolver: AggregationsDisplayNamesResolver) {
        this.resolver = resolver;
    }

}
