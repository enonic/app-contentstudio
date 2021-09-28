import * as Q from 'q';
import {ContentResponse} from './ContentResponse';
import {ListContentByIdRequest} from './ListContentByIdRequest';
import {CompareContentRequest} from './CompareContentRequest';
import {CompareContentResults} from './CompareContentResults';
import {GetContentByIdRequest} from './GetContentByIdRequest';
import {BatchContentRequest} from './BatchContentRequest';
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
import {ContentPath} from '../content/ContentPath';

export class ContentSummaryAndCompareStatusFetcher {

    private readonly contentRootPath: string;

    constructor(contentRootPath: string = 'content') {
        this.contentRootPath = contentRootPath;
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
            .then((response: ContentResponse<ContentSummary>) => {
                return CompareContentRequest.fromContentSummaries(response.getContents(), null, this.contentRootPath).sendAndParse().then(
                    (compareResults: CompareContentResults) => {
                        const contents: ContentSummaryAndCompareStatus[] = this.updateCompareStatus(response.getContents(), compareResults);

                        const promises: Q.Promise<any>[] = [];
                        promises.push(this.updateReadOnly(contents));

                        return Q.all([promises]).then(() => {
                            return new ContentResponse<ContentSummaryAndCompareStatus>(
                                contents,
                                response.getMetadata()
                            );
                        });
                    });
            });
    }

    fetch(contentId: ContentId, projectName?: string): Q.Promise<ContentSummaryAndCompareStatus> {
        return new GetContentByIdRequest(contentId)
            .setRequestProjectName(projectName)
            .setContentRootPath(this.contentRootPath)
            .sendAndParse()
            .then((content: Content) => {
                return CompareContentRequest.fromContentSummaries([content], projectName, this.contentRootPath).sendAndParse()
                    .then((compareResults: CompareContentResults) => {
                        const result: ContentSummaryAndCompareStatus = this.updateCompareStatus([content],
                            compareResults)[0];

                        const promises: Q.Promise<any>[] = [];
                        promises.push(this.updateReadOnly([result], projectName));

                        return Q.all(promises).then(() => {
                            return result;
                        });
                    });
            });

    }

    fetchByContent(content: Content): Q.Promise<ContentSummaryAndCompareStatus> {
        return CompareContentRequest.fromContentSummaries([content], null, this.contentRootPath).sendAndParse().then(
            (compareResults: CompareContentResults) => {
                const result: ContentSummaryAndCompareStatus = this.updateCompareStatus([content], compareResults)[0];

                return this.updateReadOnly([result]).then(() => result);
            });
    }

    fetchByPaths(paths: ContentPath[]): Q.Promise<ContentSummaryAndCompareStatus[]> {
        if (paths.length === 0) {
            return Q([]);
        }

        return new BatchContentRequest().setContentPaths(paths).sendAndParse().then((response: ContentResponse<ContentSummary>) => {
            const contentSummaries: ContentSummary[] = response.getContents();

            return CompareContentRequest.fromContentSummaries(contentSummaries, null, this.contentRootPath).sendAndParse().then(
                (compareResults: CompareContentResults) => {
                    return this.updateCompareStatus(contentSummaries, compareResults);
                });
        });
    }

    fetchByIds(ids: ContentId[]): Q.Promise<ContentSummaryAndCompareStatus[]> {
        if (ids.length === 0) {
            return Q([]);
        }

        return new GetContentSummaryByIds(ids).setContentRootPath(this.contentRootPath).sendAndParse().then(
            (contentSummaries: ContentSummary[]) => {

                return CompareContentRequest.fromContentSummaries(contentSummaries, null, this.contentRootPath).sendAndParse().then(
                    (compareResults: CompareContentResults) => {
                        const contents: ContentSummaryAndCompareStatus[] = this.updateCompareStatus(contentSummaries, compareResults);
                        const promises: Q.Promise<any>[] = [];
                        promises.push(this.updateReadOnly(contents));

                        return Q.all(promises).then(() => {
                            return contents;
                        });
                    });
            });
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
            .sendAndParse().then(
                (response: ContentId[]) => {
                    return response;
                });
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

    updateReadOnly(contents: ContentSummaryAndCompareStatus[], projectName?: string): Q.Promise<any> {
        return new IsContentReadOnlyRequest(contents.map(content => content.getContentId()))
            .setRequestProjectName(projectName)
            .setContentRootPath(this.contentRootPath)
            .sendAndParse().then((readOnlyContentIds: string[]) => {
                readOnlyContentIds.forEach((id: string) => {
                    contents.some(content => {
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
        return new IsRenderableRequest(content.getContentId())
            .setRequestProjectName(projectName)
            .setContentRootPath(this.contentRootPath)
            .sendAndParse()
            .then((isRenderable: boolean) => {
                content.setRenderable(isRenderable);
                return Q(null);
            });
    }
}
