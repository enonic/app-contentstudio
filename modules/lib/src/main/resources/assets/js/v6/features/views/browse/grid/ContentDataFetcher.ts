import {Expand} from '@enonic/lib-admin-ui/rest/Expand';
import {TreeNode} from '@enonic/ui';
import {ContentsTreeGridList} from '../../../../../app/browse/ContentsTreeGridList';
import {ContentId} from '../../../../../app/content/ContentId';
import {ContentQuery} from '../../../../../app/content/ContentQuery';
import {toCS6ContentStatus} from '../../../../../app/content/ContentStatus';
import {ContentSummary} from '../../../../../app/content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentSummaryJson} from '../../../../../app/content/ContentSummaryJson';
import {ContentQueryRequest} from '../../../../../app/resource/ContentQueryRequest';
import {ContentResponse} from '../../../../../app/resource/ContentResponse';
import {ContentSummaryAndCompareStatusFetcher} from '../../../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import {ChildOrder} from '../../../../../app/resource/order/ChildOrder';
import {Branch} from '../../../../../app/versioning/Branch';
import {$contentTreeItems} from '../../../store/contentTreeData.store';
import {$contentTreeRootLoadingState} from '../../../store/contentTreeLoadingStore';
import {calcWorkflowStateStatus, resolveDisplayName, resolveSubName} from '../../../utils/cms/content/workflow';
import {ContentData} from './ContentData';

export class ContentDataFetcher {

    private readonly fetcher: ContentSummaryAndCompareStatusFetcher;

    private readonly batchSize: number = 10;

    private readonly rootChildOrder: ChildOrder;

    private filterQuery: ContentQuery | null = null;

    private cachedRootItems: ContentData[] | null = null;

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

            if (!this.cachedRootItems) {
                this.cachedRootItems = $contentTreeItems.get().slice();
            }
        }
    }

    fetchChildren = async (parent: ContentData | null, offset: number): Promise<{
        items: ContentData[];
        total: number;
    }> => {
        if (!parent) {
            $contentTreeRootLoadingState.set('loading');
            const result = await this.fetchRootChildren(offset);
            $contentTreeRootLoadingState.set('ok');
            return result;
        }

        const data = await this.fetcher.fetchChildren(new ContentId(parent.id), offset, this.batchSize, undefined);

        return this.processResponse(data, parent);
    }

    private processResponse(data: ContentResponse<ContentSummaryAndCompareStatus>, parent?: ContentData) {
        this.cachedTotal.set(parent?.id ?? 'root', data.getMetadata().getTotalHits());

        return {
            items: data.getContents().map((item) => this.toContentData(item, parent)),
            total:data.getMetadata().getTotalHits()
        };
    }

    private fetchRootChildren = async (offset: number) => {
        if (this.filterQuery) {
            return this.fetchFilteredRoot(offset);
        }

        if (this.cachedRootItems) {
            const items = this.cachedRootItems;
            this.cachedRootItems = null;

            return {
                items,
                total: this.cachedTotal.get('root')
            }
        }

        const response = await this.fetcher.fetchChildren(
            null,
            offset,
            this.batchSize,
            this.rootChildOrder
        );

        return this.processResponse(response);
    };

    private async fetchFilteredRoot(offset: number) {
        const request = this.makeContentQueryRequest(offset);
        const result = await request.sendAndParse();

        const csItems = await this.fetcher.updateReadonlyAndCompareStatus(result.getContents());
        const dataItems = csItems.map(item => {
            const itemId = item.getId();
            const children = this.cachedRootItems.find(cachedRootItem => cachedRootItem.id === itemId)?.children;
            return this.toContentData(item, undefined, children);
        });

        return {
            items: dataItems,
            total: result.getMetadata().getTotalHits(),
        };
    }

    private toContentData = (item: ContentSummaryAndCompareStatus, parent?: ContentData, children?: TreeNode[]): ContentData => {
        const path = parent ? [...parent.path, parent.id] : [];

        return {
            id: item.getId().toString(),
            displayName: resolveDisplayName(item),
            name: resolveSubName(item),
            hasChildren: item.hasChildren(),
            contentType: item.getType(),
            workflowStatus: calcWorkflowStateStatus(item.getContentSummary()),
            iconUrl: item.getContentSummary().getIconUrl(),
            contentStatus: toCS6ContentStatus(item.getContentState()),
            item, // temporary, for backward compatibility
            path,
            children,
        }
    }

    private makeContentQueryRequest(from: number): ContentQueryRequest<ContentSummaryJson, ContentSummary> {
        this.filterQuery.setFrom(from).setSize(ContentsTreeGridList.FETCH_SIZE);

        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(this.filterQuery)
            .setTargetBranch(Branch.DRAFT)
            .setExpand(Expand.SUMMARY);
    }
}
