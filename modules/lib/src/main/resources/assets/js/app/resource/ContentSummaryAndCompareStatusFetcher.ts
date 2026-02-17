import Q from 'q';
import {ContentResponse} from './ContentResponse';
import {ListContentByIdRequest} from './ListContentByIdRequest';
import {CompareContentRequest} from './CompareContentRequest';
import {type CompareContentResults} from './CompareContentResults';
import {GetContentByIdRequest} from './GetContentByIdRequest';
import {GetContentSummaryByIds} from './GetContentSummaryByIds';
import {GetContentIdsByParentRequest} from './GetContentIdsByParentRequest';
import {IsContentReadOnlyRequest} from './isContentReadOnlyRequest';
import {type CompareContentResult} from './CompareContentResult';
import {type Content} from '../content/Content';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryRequest} from './ContentSummaryRequest';
import {type ContentSummary} from '../content/ContentSummary';
import {ChildOrder} from './order/ChildOrder';
import {type ContentId} from '../content/ContentId';
import {FieldOrderExpr, FieldOrderExprBuilder} from './order/FieldOrderExpr';
import {ContentResourceRequest} from './ContentResourceRequest';

export class ContentSummaryAndCompareStatusFetcher {

    private readonly contentRootPath: string;

    constructor(contentRootPath?: string) {
        this.contentRootPath = contentRootPath || ContentResourceRequest.CONTENT_PATH;
    }

    fetchRoot(from: number = 0, size: number = -1): Q.Promise<ContentResponse<ContentSummaryAndCompareStatus>> {
        return this.fetchChildren(null, from, size, this.createRootChildOrder());
    }

    createRootChildOrder(): ChildOrder {
        const childOrder: ChildOrder = new ChildOrder();

        childOrder.addOrderExpressions(ContentSummaryRequest.ROOT_ORDER.map(fieldOrderExpr => {
            return new FieldOrderExpr(new FieldOrderExprBuilder(
                {fieldName: fieldOrderExpr.getField().getName(), direction: fieldOrderExpr.directionAsString()}));
        }));

        return childOrder;
    }

    fetchChildren(parentContentId: ContentId, from: number = 0, size: number = -1,
                  childOrder?: ChildOrder): Q.Promise<ContentResponse<ContentSummaryAndCompareStatus>> {

        return new ListContentByIdRequest(parentContentId)
            .setFrom(from)
            .setSize(size)
            .setOrder(childOrder)
            .setContentRootPath(this.contentRootPath)
            .sendAndParse()
            .then((response: ContentResponse<ContentSummary>) =>
                this.updateReadonlyAndCompareStatus(response.getContents())
                    .then((contents: ContentSummaryAndCompareStatus[]) =>
                        new ContentResponse<ContentSummaryAndCompareStatus>(contents, response.getMetadata())
                    )
            );
    }

    fetch(contentId: ContentId, projectName?: string): Q.Promise<ContentSummaryAndCompareStatus> {
        return new GetContentByIdRequest(contentId)
            .setRequestProjectName(projectName)
            .setContentRootPath(this.contentRootPath)
            .sendAndParse()
            .then((content: Content) => this.fetchByContent(content, projectName));
    }

    fetchByContent(content: Content, projectName?: string): Q.Promise<ContentSummaryAndCompareStatus> {
        return this.updateReadonlyAndCompareStatus([content], projectName)
                    .then((contents: ContentSummaryAndCompareStatus[]) => contents[0]);
    }

    fetchByIds(ids: ContentId[]): Q.Promise<ContentSummary[]> {
        if (ids.length === 0) {
            return Q([]);
        }

        return new GetContentSummaryByIds(ids)
            .setContentRootPath(this.contentRootPath)
            .sendAndParse()
            .then((contentSummaries: ContentSummary[]) => contentSummaries);
    }

    fetchAndUpdateReadonly(ids: ContentId[]): Q.Promise<ContentSummaryAndCompareStatus[]> {
        return this.fetchByIds(ids)
            .then((summaries: ContentSummary[]) => this.updateReadOnly(summaries))
            .then((updatedSummaries: ContentSummary[]) => updatedSummaries.map((summary: ContentSummary) => ContentSummaryAndCompareStatus.fromContentSummary(summary)));
    }

    fetchAndCompareStatus(ids: ContentId[], projectName?: string): Q.Promise<ContentSummaryAndCompareStatus[]> {
        return this.fetchByIds(ids)
            .then((summaries: ContentSummary[]) => this.compareAndUpdateStatus(summaries, projectName));
    }

    fetchChildrenIds(parentContentId: ContentId, order?: ChildOrder): Q.Promise<ContentId[]> {
        return new GetContentIdsByParentRequest()
            .setContentRootPath(this.contentRootPath)
            .setParentId(parentContentId)
            .setOrder(order)
            .sendAndParse()
            .then((response: ContentId[]) => response);
    }

    updateCompareStatus(contentSummaries: ContentSummary[], compareResults: CompareContentResults): ContentSummaryAndCompareStatus[] {
        const list: ContentSummaryAndCompareStatus[] = [];

        contentSummaries.forEach((contentSummary: ContentSummary) => {
            const compareResult: CompareContentResult = compareResults.get(contentSummary.getId());
            list.push(ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(contentSummary, compareResult.getCompareStatus(),
                compareResult.getPublishStatus()));
        });

        return list;
    }

    updateReadOnly(contentSummaries: ContentSummary[], projectName?: string): Q.Promise<ContentSummary[]> {
        return new IsContentReadOnlyRequest(contentSummaries.map(content => content.getContentId()))
            .setRequestProjectName(projectName)
            .setContentRootPath(this.contentRootPath)
            .sendAndParse().then((readOnlyContentIds: string[]) => {
                readOnlyContentIds.forEach((id: string) => {
                    const contentSummaryToUpdate = contentSummaries.find((content: ContentSummary) => content.getId() === id);
                    contentSummaryToUpdate.setReadOnly(true);
                });

                return contentSummaries;
            });
    }

    updateReadonlyAndCompareStatus(contentSummaries: ContentSummary[], projectName?: string): Q.Promise<ContentSummaryAndCompareStatus[]> {
        return this.updateReadOnly(contentSummaries, projectName)
            .then(() => this.compareAndUpdateStatus(contentSummaries, projectName));
    }

    private compareAndUpdateStatus(contentSummaries: ContentSummary[], projectName?: string): Q.Promise<ContentSummaryAndCompareStatus[]> {
        return CompareContentRequest
            .fromContentSummaries(contentSummaries, projectName, this.contentRootPath)
            .sendAndParse()
            .then((compareResults: CompareContentResults) => this.updateCompareStatus(contentSummaries, compareResults));
    }
}
