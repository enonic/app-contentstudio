import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {BucketAggregationView} from '@enonic/lib-admin-ui/aggregation/BucketAggregationView';
import {Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {BucketView} from '@enonic/lib-admin-ui/aggregation/BucketView';
import {BucketListBox} from '@enonic/lib-admin-ui/aggregation/BucketListBox';
import {BucketViewSelectionChangedEvent} from '@enonic/lib-admin-ui/aggregation/BucketViewSelectionChangedEvent';
import {FilterableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AggregationsDisplayNamesResolver} from './AggregationsDisplayNamesResolver';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import Q from 'q';
import {ProjectContext} from '../../project/ProjectContext';

export class FilterableBucketAggregationView
    extends BucketAggregationView {

    private listBoxDropdown: FilterableListBoxWrapper<Bucket>;

    private bucketListBox: BucketListBox = new BucketListBox();

    private idsToKeepOnTop: string[] = [];

    private aggregationResolved: boolean = false;

    private resolver: AggregationsDisplayNamesResolver;

    private pendingBuckets: Bucket[] = [];

    private loadedCount: number = 0;

    private activeFilter: string = '';

    private scrollSentinel: HTMLElement;

    private sentinelObserver: IntersectionObserver;

    private static readonly PAGE_SIZE = 40;

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

        this.scrollSentinel = document.createElement('li');
        this.scrollSentinel.className = 'scroll-sentinel';
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
            if (!visible) {
                this.disconnectSentinelObserver();
                return;
            }

            if (this.loadedCount === 0) {
                this.resetAndPopulateListBox();
            }

            if (this.aggregationResolved || !this.aggregation) {
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

        this.listBoxDropdown.getOptionFilterInput().onValueChanged((event) => {
            this.activeFilter = event.getNewValue();
            this.resetAndPopulateListBox();
        });
    }

    private getFilteredBuckets(): Bucket[] {
        if (!this.activeFilter) {
            return this.pendingBuckets;
        }
        return this.pendingBuckets.filter(b => this.filterBuckets(b, this.activeFilter));
    }

    private resetAndPopulateListBox(): void {
        this.disconnectSentinelObserver();
        this.bucketListBox.clearItems();
        this.loadedCount = 0;
        this.loadNextPage();
    }

    private loadNextPage(): void {
        const filtered = this.getFilteredBuckets();
        const nextBatch = filtered.slice(this.loadedCount, this.loadedCount + FilterableBucketAggregationView.PAGE_SIZE);

        if (nextBatch.length === 0) {
            return;
        }

        this.bucketListBox.addItems(nextBatch);
        this.loadedCount += nextBatch.length;

        if (this.loadedCount < filtered.length) {
            this.attachSentinelObserver();
        }
    }

    private attachSentinelObserver(): void {
        this.disconnectSentinelObserver();

        const listEl = this.bucketListBox.getHTMLElement();
        listEl.appendChild(this.scrollSentinel);

        this.sentinelObserver = new IntersectionObserver((entries) => {
            if (entries.some(e => e.isIntersecting)) {
                this.disconnectSentinelObserver();
                this.loadNextPage();
            }
        }, {root: null, threshold: 0});

        this.sentinelObserver.observe(this.scrollSentinel);
    }

    private disconnectSentinelObserver(): void {
        if (this.sentinelObserver) {
            this.sentinelObserver.disconnect();
            this.sentinelObserver = null;
        }

        if (this.scrollSentinel.parentNode) {
            this.scrollSentinel.parentNode.removeChild(this.scrollSentinel);
        }
    }

    protected addBucket(bucket: Bucket, isSelected?: boolean) {
        this.pendingBuckets.push(bucket);

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
        this.disconnectSentinelObserver();
        this.bucketListBox.clearItems();
        this.pendingBuckets = [];
        this.loadedCount = 0;
    }

    protected hasNonEmptyBuckets(): boolean {
        return super.hasNonEmptyBuckets() || this.pendingBuckets.length > 0;
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
                const bucketToAdd: Bucket = this.pendingBuckets.find((b: Bucket) => b.getKey() === id);

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

        if (this.listBoxDropdown.isDropdownShown()) {
            this.resetAndPopulateListBox();
        }

        const isEveryPendingOnTop: boolean = this.pendingBuckets.every((bucket: Bucket) => this.isBucketToBeAlwaysOnTop(bucket));
        this.listBoxDropdown.setVisible(!isEveryPendingOnTop);
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
