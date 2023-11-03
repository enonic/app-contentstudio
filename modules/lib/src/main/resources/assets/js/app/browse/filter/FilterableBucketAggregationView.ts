import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {BucketAggregationView} from '@enonic/lib-admin-ui/aggregation/BucketAggregationView';
import {Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {BucketView} from '@enonic/lib-admin-ui/aggregation/BucketView';
import {SelectableListBoxDropdown} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxDropdown';
import {BucketListBox} from '@enonic/lib-admin-ui/aggregation/BucketListBox';
import {BucketViewSelectionChangedEvent} from '@enonic/lib-admin-ui/aggregation/BucketViewSelectionChangedEvent';
import {Aggregation} from '@enonic/lib-admin-ui/aggregation/Aggregation';

export class FilterableBucketAggregationView
    extends BucketAggregationView {

    private listBoxDropdown: SelectableListBoxDropdown<Bucket>;

    private bucketListBox: BucketListBox = new BucketListBox();

    private idsToKeepOnTop: string[] = [];

    constructor(bucketAggregation: BucketAggregation) {
        super(bucketAggregation);

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        super.initElements();

        this.bucketListBox = new BucketListBox();
        this.listBoxDropdown = new SelectableListBoxDropdown<Bucket>(this.bucketListBox, {
            filter: this.filterBuckets,
            maxSelected: 0
        });
    }

    private filterBuckets(bucket: Bucket, searchString: string): boolean {
        const lowerCaseSearchString: string = searchString.toLowerCase();
        return bucket.getKey().toLowerCase().indexOf(lowerCaseSearchString) >= 0 ||
               bucket.getDisplayName()?.toLowerCase().indexOf(lowerCaseSearchString) >= 0;
    }

    protected initListeners(): void {
        super.initListeners();

        this.listBoxDropdown.onSelectionChanged((bucketSelection: SelectionChange<Bucket>) => {
            bucketSelection.selected.forEach((item: Bucket) => {
                const bucketView: BucketView = this.bucketViews.find((view: BucketView) => view.getBucket().getKey() === item.getKey());

                if (bucketView) {
                    bucketView.select(true);
                } else {
                    super.addBucket(item, true);
                }
            });

            bucketSelection.deselected.forEach((item: Bucket) => {
                const bucketView: BucketView = this.bucketViews.find((view: BucketView) => view.getBucket().getKey() === item.getKey());

                if (bucketView) {
                    bucketView.deselect(true);

                    if (!this.isBucketToBeAlwaysOnTop(item)) {
                        this.removeBucketView(bucketView);
                    }
                }
            });

            this.notifyBucketSelectionChanged(bucketSelection);
        });
    }

    protected addBucket(bucket: Bucket, isSelected?: boolean) {
        this.bucketListBox.addItem(bucket);

        if (isSelected || this.isBucketToBeAlwaysOnTop(bucket)) {
            super.addBucket(bucket, isSelected);
        }

        if (isSelected) {
            this.listBoxDropdown.select(bucket, true);
        }
    }

    removeAll(): void {
        super.removeAll();
        this.bucketListBox.clearItems();
    }

    protected hasNonEmptyBuckets(): boolean {
        return super.hasNonEmptyBuckets() || this.bucketListBox.getItemCount() > 0;
    }

    protected addBucketView(bucketView: BucketView) {
        bucketView.onSelectionChanged((event: BucketViewSelectionChangedEvent) => {
            if (event.getNewValue()) {
                this.listBoxDropdown.select(event.getBucketView().getBucket(), true);
            } else {
                this.listBoxDropdown.deselect(event.getBucketView().getBucket(), true);

                if (!this.isBucketToBeAlwaysOnTop(bucketView.getBucket())) {
                    this.removeBucketView(bucketView);
                }
            }
        });

        super.addBucketView(bucketView);
    }

    setIdsToKeepOnToTop(ids: string[]) {
        this.idsToKeepOnTop = ids || [];

        this.idsToKeepOnTop.forEach((id: string) => {
            if (!this.hasBucketWithId(id)) {
                const bucketToAdd: Bucket = this.bucketListBox.getItem(id);

                if (bucketToAdd) {
                    super.addBucket(bucketToAdd);
                }
            }
        });

    }

    private isBucketToBeAlwaysOnTop(bucket: Bucket): boolean {
        return this.idsToKeepOnTop.some((id: string) => id === bucket.getKey());
    }

    update(aggregation: Aggregation) {
        super.update(aggregation);

        const isEveryListItemOnTop: boolean = this.bucketListBox.getItems().every((bucket: Bucket) => this.isBucketToBeAlwaysOnTop(bucket));
        this.listBoxDropdown.setVisible(!isEveryListItemOnTop);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('filterable-bucket-aggregation-view');
            this.appendChild(this.listBoxDropdown);

            return rendered;
        });
    }

}
