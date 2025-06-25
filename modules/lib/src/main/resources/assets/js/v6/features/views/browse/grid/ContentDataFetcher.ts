import {Expand} from '@enonic/lib-admin-ui/rest/Expand';
import {ContentsTreeGridList} from '../../../../../app/browse/ContentsTreeGridList';
import {ContentId} from '../../../../../app/content/ContentId';
import {ContentQuery} from '../../../../../app/content/ContentQuery';
import {ContentSummary} from '../../../../../app/content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentSummaryJson} from '../../../../../app/content/ContentSummaryJson';
import {ContentQueryRequest} from '../../../../../app/resource/ContentQueryRequest';
import {ContentResponse} from '../../../../../app/resource/ContentResponse';
import {ContentSummaryAndCompareStatusFetcher} from '../../../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import {ChildOrder} from '../../../../../app/resource/order/ChildOrder';
import {Branch} from '../../../../../app/versioning/Branch';
import {$contentTreeRootLoadingState} from '../../../store/contentTreeLoadingStore';
import {toContentData} from '../../../utils/cms/content/converter';
import {ContentData} from './ContentData';

export class ContentDataFetcher {

    private readonly fetcher: ContentSummaryAndCompareStatusFetcher;

    private readonly batchSize: number = 10;

    private readonly rootChildOrder: ChildOrder;

    private filterQuery: ContentQuery | null = null;

    private cachedTotal: Map<string, number> = new Map<string, number>();

    constructor() {
        this.fetcher = new ContentSummaryAndCompareStatusFetcher();
        this.rootChildOrder = this.fetcher.createRootChildOrder();
    }

    setFilterQuery(query: ContentQuery | null): void {
        this.filterQuery = query ? new ContentQuery() : null;

        if (query) {
            this.filterQuery
                .setSize(this.batchSize)
                .setQueryFilters(query.getQueryFilters())
                .setQuery(query.getQuery())
                .setQuerySort(query.getQuerySort())
                .setContentTypeNames(query.getContentTypes())
                .setMustBeReferencedById(query.getMustBeReferencedById());
        }
    }

    fetchChildren = async (parentId: string | undefined, offset: number): Promise<{
        items: ContentData[];
        hasMore: boolean;
    }> => {
        if (!parentId) {
            $contentTreeRootLoadingState.set('loading');
            const result = await this.fetchRootChildren(offset);
            $contentTreeRootLoadingState.set('ok');
            return result;
        }

        const data = await this.fetcher.fetchChildren(new ContentId(parentId), offset, this.batchSize, undefined);

        return this.processResponse(data, offset, parentId);
    }

    private processResponse(data: ContentResponse<ContentSummaryAndCompareStatus>, offset: number, parentId?: string): {
        items: ContentData[];
        hasMore: boolean;
    } {
        this.cachedTotal.set(parentId ?? 'root', data.getMetadata().getTotalHits());

        return {
            items: data.getContents().map((item) => toContentData(item)),
            hasMore: offset + data.getContents().length < data.getMetadata().getTotalHits(),
        };
    }

    private fetchRootChildren = async (offset: number): Promise<{
        items: ContentData[];
        hasMore: boolean;
    }> => {
        if (this.filterQuery) {
            return this.fetchFilteredRoot(offset);
        }

        const response = await this.fetcher.fetchChildren(
            null,
            offset,
            this.batchSize,
            this.rootChildOrder
        );

        return this.processResponse(response, offset);
    };

    private async fetchFilteredRoot(offset: number): Promise<{
        items: ContentData[];
        hasMore: boolean;
    }> {
        const request = this.makeContentQueryRequest(offset);
        const result = await request.sendAndParse();

        const csItems = await this.fetcher.updateReadonlyAndCompareStatus(result.getContents());
        const dataItems = csItems.map(item => {
            return toContentData(item);
        });

        return {
            items: dataItems,
            hasMore: offset + dataItems.length < result.getMetadata().getTotalHits(),
        };
    }


    private makeContentQueryRequest(from: number): ContentQueryRequest<ContentSummaryJson, ContentSummary> {
        this.filterQuery.setFrom(from).setSize(ContentsTreeGridList.FETCH_SIZE);

        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(this.filterQuery)
            .setTargetBranch(Branch.DRAFT)
            .setExpand(Expand.SUMMARY);
    }
}
