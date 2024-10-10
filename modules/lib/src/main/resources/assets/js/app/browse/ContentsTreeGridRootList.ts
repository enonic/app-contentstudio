import {ContentsTreeGridList} from './ContentsTreeGridList';
import {ContentQuery} from '../content/ContentQuery';
import {Branch} from '../versioning/Branch';
import Q from 'q';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentQueryResult} from '../resource/ContentQueryResult';
import {ContentSummary} from '../content/ContentSummary';
import {ContentSummaryJson} from '../content/ContentSummaryJson';
import {ContentQueryRequest} from '../resource/ContentQueryRequest';
import {Expand} from '@enonic/lib-admin-ui/rest/Expand';
import {ContentTreeGridLoadedEvent} from './ContentTreeGridLoadedEvent';

export class ContentsTreeGridRootList extends ContentsTreeGridList {

    private filterQuery: ContentQuery;

    private branch: Branch = Branch.DRAFT;

    protected initListeners(): void {
        super.initListeners();

        const listener = () => {
          new ContentTreeGridLoadedEvent().fire();
          this.unItemsAdded(listener);
        };

        this.onItemsAdded(listener);
    }

    setTargetBranch(branch: Branch): void {
        this.branch = branch;
    }

    setFilterQuery(query: ContentQuery | null): void {
        this.filterQuery = query ? new ContentQuery() : null;

        if (query) {
            this.filterQuery
                .setSize(ContentsTreeGridList.FETCH_SIZE)
                .setQueryFilters(query.getQueryFilters())
                .setQuery(query.getQuery())
                .setQuerySort(query.getQuerySort())
                .setContentTypeNames(query.getContentTypes())
                .setMustBeReferencedById(query.getMustBeReferencedById());
        }

        this.load();
    }

    isFiltered(): boolean {
        return !!this.filterQuery;
    }

    protected fetchRootItems(): Q.Promise<ContentSummaryAndCompareStatus[]> {
        if (!this.filterQuery) {
            return super.fetchRootItems();
        }

        const from: number = this.getItemCount() - this.newItems.size;

        return this.makeContentQueryRequest(from).sendAndParse().then(
            (contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                return this.fetcher.updateReadonlyAndCompareStatus(contentQueryResult.getContents());
            });
    }

    private makeContentQueryRequest(from: number): ContentQueryRequest<ContentSummaryJson, ContentSummary> {
        this.filterQuery.setFrom(from).setSize(ContentsTreeGridList.FETCH_SIZE);

        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(this.filterQuery)
            .setTargetBranch(this.branch)
            .setExpand(Expand.SUMMARY);
    }
}
