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
import {TreeListBox} from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';

export class ContentsTreeGridRootList extends ContentsTreeGridList {

    private filterQuery: ContentQuery;

    private branch: Branch = Branch.DRAFT;

    private rootItems: string[] = [];

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

    load(): void {
        this.rootItems = [];
        super.load();
    }

    findParentList(item: ContentSummaryAndCompareStatus): ContentsTreeGridList {
        const itemId = this.getItemId(item);

        if (this.rootItems.indexOf(itemId) >= 0) {
            return this;
        }

        return super.findParentList(item);
    }

    protected fetchRootItems(): Q.Promise<ContentSummaryAndCompareStatus[]> {
        if (!this.filterQuery) {
            return super.fetchRootItems();
        }

        const from: number = this.getItemCount() - this.newItems.size;

        return this.makeContentQueryRequest(from).sendAndParse().then(
            (contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                const moreRootItemsIds = contentQueryResult.getContents().map(content => content.getId());
                this.rootItems = this.rootItems.concat(moreRootItemsIds);
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
