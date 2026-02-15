import {type SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {type BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {BucketAggregationView} from '@enonic/lib-admin-ui/aggregation/BucketAggregationView';
import {type Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {type BucketView} from '@enonic/lib-admin-ui/aggregation/BucketView';
import {BucketListBox} from '@enonic/lib-admin-ui/aggregation/BucketListBox';
import {type BucketViewSelectionChangedEvent} from '@enonic/lib-admin-ui/aggregation/BucketViewSelectionChangedEvent';
import {FilterableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type AggregationsDisplayNamesResolver} from './AggregationsDisplayNamesResolver';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import type Q from 'q';
import {ProjectContext} from '../../project/ProjectContext';

export class FilterableBucketAggregationView
    extends BucketAggregationView {

    private listBoxDropdown: FilterableListBoxWrapper<Bucket>;

    private bucketListBox: BucketListBox = new BucketListBox();

    private idsToKeepOnTop: string[] = [];

    private aggregationResolved: boolean = false;

    private resolver: AggregationsDisplayNamesResolver;

    constructor(bucketAggregation: BucketAggregation) {
        super(bucketAggregation);

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        super.initElements();

        this.bucketListBox = new BucketListBox();
        this.listBoxDropdown = new BucketDropdown(this.bucketListBox, {
            filter: this.filterBuckets,
            maxSelected: 0
        });
    }

    setResolver(resolver: AggregationsDisplayNamesResolver): void {
        this.resolver = resolver;
    }

    private filterBuckets(bucket: Bucket, searchString: string): boolean {
        const lowerCaseSearchString: string = searchString.toLowerCase();
        return bucket.getKey().toLowerCase().indexOf(lowerCaseSearchString) >= 0 ||
               bucket.getDisplayName()?.toLowerCase().indexOf(lowerCaseSearchString) >= 0;
    }

    protected initListeners(): void {
        super.initListeners();

        ProjectContext.get().onProjectChanged(() => {
            this.aggregationResolved = false;
        });

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

        this.listBoxDropdown.onDropdownVisibilityChanged((visible: boolean) => {
            if (!visible || this.aggregationResolved || !this.aggregation) {
                return;
            }
            const loadMask = new LoadMask(this.listBoxDropdown);
            loadMask.show();
            this.resolver.updateUnknownPrincipals(this.aggregation)
                .then(() => {
                    this.aggregationResolved = true;
                    this.update(this.aggregation);
                })
                .finally(() => loadMask.hide());
        });
    }

    protected addBucket(bucket: Bucket, isSelected?: boolean) {
        this.bucketListBox.addItems(bucket);

        if (isSelected || this.isBucketToBeAlwaysOnTop(bucket)) {
            super.addBucket(bucket, isSelected);
        }

        if (isSelected) {
            this.listBoxDropdown.select(bucket, true);
        }
    }

    removeAll(): void {
        super.removeAll();
        this.listBoxDropdown.deselectAll(true);
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

    update(aggregation: BucketAggregation): void {
        this.aggregation = aggregation;

        this.resolver.updateKnownPrincipals(this.aggregation);

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

class BucketDropdown extends FilterableListBoxWrapper<Bucket> {

    protected initElements(): void {
        super.initElements();

        this.applyButton.setLabel(i18n('action.ok'));
    }

}
