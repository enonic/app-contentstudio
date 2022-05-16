import {BucketAggregation} from 'lib-admin-ui/aggregation/BucketAggregation';
import {BucketAggregationView} from 'lib-admin-ui/aggregation/BucketAggregationView';
import {Bucket} from 'lib-admin-ui/aggregation/Bucket';
import {BucketView} from 'lib-admin-ui/aggregation/BucketView';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {SelectableListBoxDropdown} from 'lib-admin-ui/ui/selector/list/SelectableListBoxDropdown';
import {BucketListBox} from 'lib-admin-ui/aggregation/BucketListBox';
import {BucketViewSelectionChangedEvent} from 'lib-admin-ui/aggregation/BucketViewSelectionChangedEvent';

export class FilterableBucketAggregationView
    extends BucketAggregationView {

    private listBoxDropdown: SelectableListBoxDropdown<Bucket>;

    private bucketListBox: BucketListBox = new BucketListBox();

    private bucketsContainer: DivEl;

    private idsToKeepOnTop: string[] = [];

    constructor(bucketAggregation: BucketAggregation) {
        super(bucketAggregation);

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.bucketListBox = new BucketListBox();
        this.listBoxDropdown = new SelectableListBoxDropdown<Bucket>(this.bucketListBox, {
            filter: this.filterBuckets,
            multiple: true
        });
        this.createBucketsContainer();
        this.appendChild(this.listBoxDropdown);
    }

    private filterBuckets(bucket: Bucket, searchString: string): boolean {
        const lowerCaseSearchString: string = searchString.toLowerCase();
        return bucket.getKey().toLowerCase().indexOf(lowerCaseSearchString) >= 0 ||
               bucket.getDisplayName()?.toLowerCase().indexOf(lowerCaseSearchString) >= 0;
    }

    private createBucketsContainer(): void {
        this.bucketsContainer = new DivEl('buckets-container');
        this.appendChild(this.bucketsContainer);
    }

    private initListeners(): void {
        this.listBoxDropdown.onSelectionChanged((selected: Bucket[], deselected: Bucket[]) => {
            selected.forEach((item: Bucket) => {
                const bucketView: BucketView = this.bucketViews.find((view: BucketView) => view.getBucket().getKey() === item.getKey());

                if (bucketView) {
                    bucketView.select(true);
                } else {
                    super.addBucket(item, true);
                }
            });

            deselected.forEach((item: Bucket) => {
                const bucketView: BucketView = this.bucketViews.find((view: BucketView) => view.getBucket().getKey() === item.getKey());

                if (bucketView) {
                    bucketView.deselect(true);

                    if (!this.isBucketToBeAlwaysOnTop(item)) {
                        this.removeBucketView(bucketView);
                    }
                }
            });

            this.notifyBucketSelectionChanged(selected, deselected);
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

    protected appendBucketView(bucketView: BucketView) {
        this.bucketsContainer.appendChild(bucketView);
    }

    protected addBucketView(bucketView: BucketView) {
        bucketView.onSelectionChanged((event: BucketViewSelectionChangedEvent) => {
                if (event.getNewValue()) {
                    this.listBoxDropdown.select(event.getBucketView().getBucket(), true);
                } else {
                    this.listBoxDropdown.deselect(event.getBucketView().getBucket(), true);
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
}
