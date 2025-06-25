import Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Router} from '../../Router';
import {ContentServerEventsHandler} from '../../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentQuery} from '../../content/ContentQuery';
import {AggregationGroupView} from '@enonic/lib-admin-ui/aggregation/AggregationGroupView';
import {Aggregation} from '@enonic/lib-admin-ui/aggregation/Aggregation';
import {BrowseFilterPanel} from '@enonic/lib-admin-ui/app/browse/filter/BrowseFilterPanel';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {BucketAggregationView} from '@enonic/lib-admin-ui/aggregation/BucketAggregationView';
import {ContentServerChangeItem} from '../../event/ContentServerChangeItem';
import {ProjectContext} from '../../project/ProjectContext';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentId} from '../../content/ContentId';
import {DependenciesSection} from './DependenciesSection';
import {ContentAggregation} from './ContentAggregation';
import {AggregationsDisplayNamesResolver} from './AggregationsDisplayNamesResolver';
import {ContentAggregationsFetcher} from './ContentAggregationsFetcher';
import {FilterableAggregationGroupView} from './FilterableAggregationGroupView';
import {AggregationsQueryResult} from './AggregationsQueryResult';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentExportElement} from './ContentExportElement';
import {ContentDependency} from './ContentDependency';
import {TextSearchField} from '@enonic/lib-admin-ui/app/browse/filter/TextSearchField';
import {Branch} from '../../versioning/Branch';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';

export class ContentBrowseFilterPanel<T extends ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatus>
    extends BrowseFilterPanel<T> {

    protected aggregations: Map<string, AggregationGroupView>;
    protected displayNamesResolver: AggregationsDisplayNamesResolver;
    protected aggregationsFetcher: ContentAggregationsFetcher;
    protected searchEventListeners: ((query?: ContentQuery) => void)[] = [];

    private dependenciesSection: DependenciesSection;
    private elementsContainer: Element;
    private exportElement?: ContentExportElement;
    private targetBranch: Branch = Branch.DRAFT;

    constructor() {
        super();

        this.addClass('content-browse-filter-panel');
        this.aggregationsFetcher = this.createAggregationFetcher();

        this.getAndUpdateAggregations();
        this.initElementsAndListeners();
    }

    protected createAggregationFetcher(): ContentAggregationsFetcher {
        return new ContentAggregationsFetcher();
    }

    onSearchEvent(listener: (query?: ContentQuery) => void): void {
        this.searchEventListeners.push(listener);
    }

    unSearchEvent(listener: (query?: ContentQuery) => void): void {
        this.searchEventListeners = this.searchEventListeners.filter((curr: (query?: ContentQuery) => void) => {
            return curr !== listener;
        });
    }

    private notifySearchEvent(query?: ContentQuery): void {
        this.searchEventListeners.forEach((listener: (q?: ContentQuery) => void) => {
            listener(query);
        });
    }

    protected initElementsAndListeners() {
        if (this.isExportAllowed()) {
            this.exportElement = new ContentExportElement().setEnabled(false).setTitle(i18n('action.export')) as ContentExportElement;
        }

        this.handleEvents();
    }

    protected handleEvents() {
        this.onRendered(() => {
            super.appendChild(this.elementsContainer);
        });

        this.handleEventsForDependenciesSection();
    }

    private handleEventsForDependenciesSection() {
        const handler = ContentServerEventsHandler.getInstance();

        handler.onContentDeleted((data: ContentServerChangeItem[]) => {
            if (!this.dependenciesSection.isActive()) {
                return;
            }

            const isDependencyItemDeleted = data.some((item: ContentServerChangeItem) => {
                return item.getContentId().equals(this.dependenciesSection.getDependencyId());
            });

            if (isDependencyItemDeleted) {
                this.removeDependencyItem();
            }
        });

        const permissionsUpdatedHandler = (data: T[]) => {
            if (!this.dependenciesSection.isActive()) {
                return;
            }

            if (ContentSummaryAndCompareStatus.isInArray(this.dependenciesSection.getDependencyId(), data)) {
                this.search();
            }
        };

        const updatedHandler = (data: T[]) => permissionsUpdatedHandler(data);

        handler.onContentUpdated(updatedHandler);
        handler.onContentPermissionsUpdated(permissionsUpdatedHandler);

        ProjectContext.get().onProjectChanged(() => {
            if (this.dependenciesSection.isActive()) {
                this.removeDependencyItem();
            }
        });
    }

    protected createHitsCountContainer(): DivEl {
        const hitsCounterAndClearButtonWrapper = super.createHitsCountContainer();
        if (this.exportElement) {
            hitsCounterAndClearButtonWrapper.appendChild(this.exportElement);
        }

        return hitsCounterAndClearButtonWrapper;
    }

    protected getAggregationEnum(): Record<string, string> {
        return ContentAggregation;
    }

    protected getGroupViews(): AggregationGroupView[] {
        this.aggregations = new Map<string, AggregationGroupView>();

        const aggregationEnum = this.getAggregationEnum();
        for (let aggrEnum in aggregationEnum) {
            const name: string = aggregationEnum[aggrEnum];
            this.aggregations.set(name, this.createGroupView(name));
        }

        return Array.from(this.aggregations.values());
    }

    protected isPrincipalAggregation(name: string): boolean {
        return name === ContentAggregation.OWNER.toString() || name === ContentAggregation.MODIFIED_BY.toString();
    }

    protected createGroupView(name: string): AggregationGroupView {
        if (this.isPrincipalAggregation(name)) {
            const currentUserKey = this.getCurrentUserKeyAsString();
            if (!this.displayNamesResolver) {
                this.displayNamesResolver = new AggregationsDisplayNamesResolver(currentUserKey);
            }
            const aggregationGroupView = new FilterableAggregationGroupView(name, i18n(`field.${name}`));
            aggregationGroupView.setIdsToKeepOnToTop([currentUserKey]);
            aggregationGroupView.setResolver(this.displayNamesResolver);

            return aggregationGroupView;
        }

        return new AggregationGroupView(name, i18n(`field.${name}`));
    }

    protected appendExtraSections() {
        super.appendExtraSections();
        this.dependenciesSection = new DependenciesSection();
        this.appendChild(this.dependenciesSection);
    }

    protected isExportAllowed(): boolean {
        // add more checks here if needed
        return true;
    }

    private removeDependencyItem() {
        this.dependenciesSection.reset();
        this.resetConstraints();
        this.search();
        Router.get().back();
    }

    public setDependencyItem(item: ContentSummary, inbound: boolean, type?: string): void {
        this.dependenciesSection.setInbound(inbound);

        if (type) {
            this.selectBucketByTypeOnLoad(type);
        }

        this.setConstraintItems(this.dependenciesSection, [item.getId()]);
        this.dependenciesSection.setDependencyItem(item);
    }

    public setTargetBranch(branch: Branch): void {
        this.targetBranch = branch;
        this.aggregationsFetcher.setTargetBranch(this.targetBranch);
    }

    public getTargetBranch(): Branch {
        return this.targetBranch;
    }

    private selectBucketByTypeOnLoad(type: string): void {
        const handler = () => { // waiting for aggregations views added
            this.unSearchEvent(handler);
            this.selectContentTypeBucket(type);
        };

        this.onSearchEvent(handler);
    }

    private selectContentTypeBucket(key: string): void {
        (this.aggregations.get(ContentAggregation.CONTENT_TYPE).getAggregationViews()[0] as BucketAggregationView)?.selectBucketViewByKey(key);
    }

    searchItemById(id: ContentId): void {
        this.getSearchField()?.setValue(id.toString());
    }

    private getSearchField(): TextSearchField {
        const textSearchFieldParent = this.elementsContainer.getChildren().find((child: Element) => child.hasClass('search-container'));
        return textSearchFieldParent?.getChildren().find((child: Element) => child instanceof TextSearchField);
    }

    doRefresh(): Q.Promise<void> {
        if (!this.isFilteredOrConstrained()) {
            return this.resetFacets(true);
        }

        return this.getAndUpdateAggregations().then((aggregationsQueryResult: AggregationsQueryResult) => {
            if (aggregationsQueryResult.getMetadata().getTotalHits() > 0) {
                return;
            }

            if (this.dependenciesSection.isActive()) {
                this.removeDependencyItem();
            }

            return this.reset(true);
        });
    }

    protected doSearch(): Q.Promise<void> {
        if (!this.isFilteredOrConstrained()) {
            return this.resetFacets();
        }

        return this.getAndUpdateAggregations().then(() => {
            this.notifySearchEvent(this.aggregationsFetcher.createContentQuery(this.getSearchInputValues()));
        });
    }

    setSelectedItems(itemsIds: string[]) {
        this.dependenciesSection.reset();
        super.setSelectedItems(itemsIds);
    }

    protected isFilteredOrConstrained() {
        return super.isFilteredOrConstrained() || (this.dependenciesSection?.isActive() ?? false);
    }

    private getAndUpdateAggregations(): Q.Promise<AggregationsQueryResult> {
        this.exportElement?.setEnabled(false);

        return this.getAggregations().then((aggregationsQueryResult: AggregationsQueryResult) => {
            this.updateHitsCounter(aggregationsQueryResult.getMetadata().getTotalHits());
            this.updateExportState(aggregationsQueryResult);

            return this.processAggregations(aggregationsQueryResult.getAggregations()).then(() => {
                return aggregationsQueryResult;
            });
        });
    }

    private updateExportState(aggregationsQueryResult: AggregationsQueryResult): void {
        if (!this.exportElement) {
            return;
        }
        this.exportElement.setTotal(aggregationsQueryResult.getMetadata().getTotalHits());
        this.exportElement.setSearchInputValues(this.getSearchInputValues());
        this.exportElement.setDependency(this.getDependency());
        this.exportElement.setConstraintIds(this.hasConstraint() ? this.getSelectionItems().slice() : null);
        this.exportElement.setEnabled(aggregationsQueryResult.getMetadata().getTotalHits() > 0);
    }

    private processAggregations(aggregations: Aggregation[]): Q.Promise<void> {
        this.toggleAggregationsVisibility(aggregations);

        return this.displayNamesResolver.updateAggregationsDisplayNames(aggregations, this.getCurrentUserKeyAsString()).then(() => {
            this.updateAggregations(aggregations);
        });
    }

    private getCurrentUserKeyAsString(): string {
        return AuthContext.get().getUser().getKey().toString();
    }

    private getAggregations(): Q.Promise<AggregationsQueryResult> {
        this.aggregationsFetcher.setSearchInputValues(this.getSearchInputValues());
        this.aggregationsFetcher.setConstraintItemsIds(this.hasConstraint() ? this.getSelectionItems().slice() : null);
        this.aggregationsFetcher.setDependency(this.getDependency());

        return this.aggregationsFetcher.getAggregations();
    }

    protected resetFacets(suppressEvent?: boolean, doResetAll?: boolean): Q.Promise<void> {
        this.setTargetBranch(Branch.DRAFT);

        return this.getAndUpdateAggregations().then(() => {
            if (!suppressEvent) {
                this.notifySearchEvent();
            }
        });
    }

    getDependency(): ContentDependency {
        if (this.dependenciesSection?.isInbound()) {
            return {isInbound: true, dependencyId: this.dependenciesSection.getDependencyId()};
        }

        if (this.dependenciesSection?.isOutbound()) {
            return {isInbound: false, dependencyId: this.dependenciesSection.getDependencyId()};
        }

        return null;
    }

    private toggleAggregationsVisibility(aggregations: Aggregation[]) {
        aggregations.forEach((aggregation: BucketAggregation) => {
            const isAggregationNotEmpty: boolean = aggregation.getBuckets().some((bucket: Bucket) => bucket.docCount > 0);
            this.aggregations.get(aggregation.getName()).setVisible(isAggregationNotEmpty);
        });
    }


    // doing a trick to avoid changing lib-admin-ui, adding all children except export button to a wrapper
    appendChild(child: Element, lazyRender?: boolean): Element {
        if (!this.elementsContainer) {
            this.elementsContainer = new DivEl('elements-container');
        }

        return this.elementsContainer.appendChild(child, lazyRender);
    }
}
