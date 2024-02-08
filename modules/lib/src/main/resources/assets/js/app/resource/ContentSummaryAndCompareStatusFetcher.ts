import * as Q from 'q';
import {ContentResponse} from './ContentResponse';
import {ListContentByIdRequest} from './ListContentByIdRequest';
import {CompareContentRequest} from './CompareContentRequest';
import {CompareContentResults} from './CompareContentResults';
import {GetContentByIdRequest} from './GetContentByIdRequest';
import {GetContentSummaryByIds} from './GetContentSummaryByIds';
import {GetContentIdsByParentRequest} from './GetContentIdsByParentRequest';
import {IsContentReadOnlyRequest} from './isContentReadOnlyRequest';
import {CompareContentResult} from './CompareContentResult';
import {Content} from '../content/Content';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryRequest} from './ContentSummaryRequest';
import {IsRenderableRequest} from './IsRenderableRequest';
import {ContentSummary} from '../content/ContentSummary';
import {ChildOrder} from './order/ChildOrder';
import {ContentId} from '../content/ContentId';
import {FieldOrderExpr, FieldOrderExprBuilder} from './order/FieldOrderExpr';
import {ContentResourceRequest} from './ContentResourceRequest';
import {StatusCode} from '@enonic/lib-admin-ui/rest/StatusCode';

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
            .then((content: Content) => this.fetchByContent(content));
    }

    fetchByContent(content: Content): Q.Promise<ContentSummaryAndCompareStatus> {
        return this.updateReadonlyAndCompareStatus([content])
                    .then((contents: ContentSummaryAndCompareStatus[]) => contents[0]);
    }

    fetchByIds(ids: ContentId[]): Q.Promise<ContentSummaryAndCompareStatus[]> {
        if (ids.length === 0) {
            return Q([]);
        }

        return new GetContentSummaryByIds(ids)
            .setContentRootPath(this.contentRootPath)
            .sendAndParse()
            .then((contentSummaries: ContentSummary[]) =>
                this.updateReadonlyAndCompareStatus(contentSummaries)
                    .then((contents: ContentSummaryAndCompareStatus[]) => contents)
            );
    }

    fetchStatus(contentSummaries: ContentSummary[]): Q.Promise<ContentSummaryAndCompareStatus[]> {
        return CompareContentRequest.fromContentSummaries(contentSummaries, null, this.contentRootPath).sendAndParse()
            .then((compareResults: CompareContentResults) => {
                return this.updateCompareStatus(contentSummaries, compareResults);
            });
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

    updateReadOnly(contentSummaries: ContentSummary[], projectName?: string): Q.Promise<boolean> {
        return new IsContentReadOnlyRequest(contentSummaries.map(content => content.getContentId()))
            .setRequestProjectName(projectName)
            .setContentRootPath(this.contentRootPath)
            .sendAndParse().then((readOnlyContentIds: string[]) => {
                readOnlyContentIds.forEach((id: string) => {
                    contentSummaries.some(content => {
                        if (content.getId() === id) {
                            content.setReadOnly(true);
                            return true;
                        }
                    });
                });

                return true;
            });
    }

    updateRenderableContents(contents: ContentSummaryAndCompareStatus[], projectName?: string): Q.Promise<void[]> {
        const isRenderablePromises: Q.Promise<void>[] = [];

        contents.forEach((content: ContentSummaryAndCompareStatus) => {
            isRenderablePromises.push(this.updateRenderableContent(content, projectName));
        });

        return Q.all(isRenderablePromises);
    }

    updateRenderableContent(content: ContentSummaryAndCompareStatus, projectName?: string): Q.Promise<void> {
        return new IsRenderableRequest(content.getContentSummary())
            .sendAndParse()
            .then((statusCode: number) => {
                content.setRenderable(statusCode === StatusCode.OK);
                return Q(null);
            });
    }

    updateReadonlyAndCompareStatus(contentSummaries: ContentSummary[], projectName?: string): Q.Promise<ContentSummaryAndCompareStatus[]> {
        return this.updateReadOnly(contentSummaries, projectName)
            .then(() => {
                return CompareContentRequest
                    .fromContentSummaries(contentSummaries, projectName, this.contentRootPath)
                    .sendAndParse()
                    .then((compareResults: CompareContentResults) => Q(this.updateCompareStatus(contentSummaries, compareResults)));
            });
    }
}
