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

    static fetchRoot(from: number = 0, size: number = -1,
                     contentRootPath: string = 'content'): Q.Promise<ContentResponse<ContentSummaryAndCompareStatus>> {
        return ContentSummaryAndCompareStatusFetcher.fetchChildren(null, from, size, contentRootPath, this.createRootChildOrder());
    }

    static createRootChildOrder(): ChildOrder {
        const childOrder: ChildOrder = new ChildOrder();

        childOrder.addOrderExpressions(ContentSummaryRequest.ROOT_ORDER.map(fieldOrderExpr => {
            return new FieldOrderExpr(new FieldOrderExprBuilder(
                {fieldName: fieldOrderExpr.getField().getName(), direction: fieldOrderExpr.directionAsString()}));
        }));

        return childOrder;
    }

    static fetchChildren(parentContentId: ContentId, from: number = 0, size: number = -1, contentRootPath: string = 'content',
                         childOrder?: ChildOrder): Q.Promise<ContentResponse<ContentSummaryAndCompareStatus>> {

        return new ListContentByIdRequest(parentContentId).setFrom(from).setSize(size).setOrder(childOrder).setContentRootPath(
            contentRootPath).sendAndParse().then(
            (response: ContentResponse<ContentSummary>) => {

                return CompareContentRequest.fromContentSummaries(response.getContents()).sendAndParse().then(
                    (compareResults: CompareContentResults) => {

                        const contents: ContentSummaryAndCompareStatus[] = ContentSummaryAndCompareStatusFetcher.updateCompareStatus(
                            response.getContents(), compareResults);

                        const promises: Q.Promise<any>[] = [];
                        promises.push(ContentSummaryAndCompareStatusFetcher.updateReadOnly(contents));

                        return Q.all([promises]).then(() => {
                            return new ContentResponse<ContentSummaryAndCompareStatus>(
                                contents,
                                response.getMetadata()
                            );
                        });
                    });
            });
    }

    static fetch(contentId: ContentId, projectName?: string): Q.Promise<ContentSummaryAndCompareStatus> {
        return new GetContentByIdRequest(contentId).setRequestProjectName(projectName).sendAndParse().then((content: Content) => {
            return CompareContentRequest.fromContentSummaries([content], projectName).sendAndParse()
                .then((compareResults: CompareContentResults) => {
                    const result: ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatusFetcher.updateCompareStatus([content],
                        compareResults)[0];

                    const promises: Q.Promise<any>[] = [];
                    promises.push(ContentSummaryAndCompareStatusFetcher.updateReadOnly([result], projectName));

                    return Q.all(promises).then(() => {
                        return result;
                    });
                });
        });

    }

    static fetchByContent(content: Content): Q.Promise<ContentSummaryAndCompareStatus> {
        return CompareContentRequest.fromContentSummaries([content]).sendAndParse().then((compareResults: CompareContentResults) => {
            const result: ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatusFetcher.updateCompareStatus([content],
                compareResults)[0];

            return ContentSummaryAndCompareStatusFetcher.updateReadOnly([result]).then(() => result);
        });
    }

    static fetchByPaths(paths: ContentPath[]): Q.Promise<ContentSummaryAndCompareStatus[]> {

        if (paths.length > 0) {
            return new BatchContentRequest().setContentPaths(paths).sendAndParse().then((response: ContentResponse<ContentSummary>) => {
                const contentSummaries: ContentSummary[] = response.getContents();

                return CompareContentRequest.fromContentSummaries(contentSummaries).sendAndParse().then(
                    (compareResults: CompareContentResults) => {

                        return ContentSummaryAndCompareStatusFetcher.updateCompareStatus(contentSummaries, compareResults);
                    });
            });
        }
        return Q([]);
    }

    static fetchByIds(ids: ContentId[]): Q.Promise<ContentSummaryAndCompareStatus[]> {

        if (ids.length > 0) {
            return new GetContentSummaryByIds(ids).sendAndParse().then((contentSummaries: ContentSummary[]) => {

                return CompareContentRequest.fromContentSummaries(contentSummaries).sendAndParse().then(
                    (compareResults: CompareContentResults) => {

                        const contents: ContentSummaryAndCompareStatus[] = ContentSummaryAndCompareStatusFetcher.updateCompareStatus(
                            contentSummaries, compareResults);

                        const promises: Q.Promise<any>[] = [];
                        promises.push(ContentSummaryAndCompareStatusFetcher.updateReadOnly(contents));

                        return Q.all(promises).then(() => {
                            return contents;
                        });
                    });
            });
        }
        return Q([]);
    }

    static fetchStatus(contentSummaries: ContentSummary[]): Q.Promise<ContentSummaryAndCompareStatus[]> {

        return CompareContentRequest.fromContentSummaries(contentSummaries).sendAndParse()
            .then((compareResults: CompareContentResults) => {

                return ContentSummaryAndCompareStatusFetcher.updateCompareStatus(contentSummaries, compareResults);
            });
    }

    static fetchChildrenIds(parentContentId: ContentId, order?: ChildOrder): Q.Promise<ContentId[]> {

        return new GetContentIdsByParentRequest().setParentId(parentContentId).setOrder(order).sendAndParse().then(
            (response: ContentId[]) => {

                return response;
            });
    }

    static updateCompareStatus(contentSummaries: ContentSummary[],
                               compareResults: CompareContentResults): ContentSummaryAndCompareStatus[] {
        const list: ContentSummaryAndCompareStatus[] = [];

        contentSummaries.forEach((contentSummary: ContentSummary) => {

            const compareResult: CompareContentResult = compareResults.get(contentSummary.getId());

            const newEntry = ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(
                contentSummary, compareResult.getCompareStatus(), compareResult.getPublishStatus());

            list.push(newEntry);
        });

        return list;
    }

    static updateReadOnly(contents: ContentSummaryAndCompareStatus[], projectName?: string): Q.Promise<any> {
        return new IsContentReadOnlyRequest(contents.map(content => content.getContentId()))
            .setRequestProjectName(projectName)
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

    static updateRenderableContents(contents: ContentSummaryAndCompareStatus[], projectName?: string): Q.Promise<void[]> {
        const isRenderablePromises: Q.Promise<void>[] = [];

        contents.forEach((content: ContentSummaryAndCompareStatus) => {
            isRenderablePromises.push(this.updateRenderableContent(content, projectName));
        });

        return Q.all(isRenderablePromises);
    }

    static updateRenderableContent(content: ContentSummaryAndCompareStatus, projectName?: string): Q.Promise<void> {
        return new IsRenderableRequest(content.getContentId())
            .setRequestProjectName(projectName)
            .sendAndParse()
            .then((isRenderable: boolean) => {
                content.setRenderable(isRenderable);
                return Q(null);
            });
    }
}
