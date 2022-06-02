import {Aggregation} from '@enonic/lib-admin-ui/aggregation/Aggregation';
import {AggregationGroupView} from '@enonic/lib-admin-ui/aggregation/AggregationGroupView';
import {AggregationView} from '@enonic/lib-admin-ui/aggregation/AggregationView';
import {Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {FilterableBucketAggregationView} from './FilterableBucketAggregationView';

export class FilterableAggregationGroupView
    extends AggregationGroupView {

    private idsToKeepOnToTop: string[];

    protected createAggregationView(aggregation: Aggregation): AggregationView {
        const aggregationView: FilterableBucketAggregationView = new FilterableBucketAggregationView(<BucketAggregation>aggregation);

        aggregationView.onBucketSelectionChanged((bucketSelection: SelectionChange<Bucket>) =>
            this.notifyBucketViewSelectionChanged(bucketSelection)
        );

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

}
