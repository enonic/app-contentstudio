import * as Q from 'q';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {ChildOrder} from 'lib-admin-ui/content/order/ChildOrder';
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
import {FieldOrderExpr, FieldOrderExprBuilder} from 'lib-admin-ui/content/order/FieldOrderExpr';
import {Project} from '../settings/data/project/Project';

export class ContentSummaryAndCompareStatusFetcher {

    static fetchRoot(from: number = 0, size: number = -1): Q.Promise<ContentResponse<ContentSummaryAndCompareStatus>> {
        return ContentSummaryAndCompareStatusFetcher.fetchChildren(null, from, size, this.createRootChildOrder());
    }

    private static createRootChildOrder(): ChildOrder {
        const childOrder: ChildOrder = new ChildOrder();

        childOrder.addOrderExpressions(ContentSummaryRequest.ROOT_ORDER.map(fieldOrderExpr => {
            return new FieldOrderExpr(new FieldOrderExprBuilder(
                {fieldName: fieldOrderExpr.getField().getName(), direction: fieldOrderExpr.directionAsString()}));
        }));

        return childOrder;
    }

    static fetchChildren(parentContentId: ContentId, from: number = 0, size: number = -1,
                         childOrder?: ChildOrder): Q.Promise<ContentResponse<ContentSummaryAndCompareStatus>> {

        return new ListContentByIdRequest(parentContentId).setFrom(from).setSize(size).setOrder(childOrder).sendAndParse().then(
            (response: ContentResponse<ContentSummary>) => {

                return CompareContentRequest.fromContentSummaries(response.getContents()).sendAndParse().then(
                    (compareResults: CompareContentResults) => {

                        const contents: ContentSummaryAndCompareStatus[] = ContentSummaryAndCompareStatusFetcher.updateCompareStatus(
                            response.getContents(), compareResults);

                        return ContentSummaryAndCompareStatusFetcher.updateReadOnly(contents).then(() => {

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

                    return ContentSummaryAndCompareStatusFetcher.updateCompareStatus([content], compareResults)[0];
                });
        });

    }

    static fetchByContent(content: Content): Q.Promise<ContentSummaryAndCompareStatus> {

        return CompareContentRequest.fromContentSummaries([content]).sendAndParse().then((compareResults: CompareContentResults) => {
            return ContentSummaryAndCompareStatusFetcher.updateCompareStatus([content], compareResults)[0];
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

                        return ContentSummaryAndCompareStatusFetcher.updateReadOnly(contents).then(() => {
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

    static fetchChildrenIds(parentContentId: ContentId): Q.Promise<ContentId[]> {

        return new GetContentIdsByParentRequest().setParentId(parentContentId).sendAndParse().then(
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

    static updateReadOnly(contents: ContentSummaryAndCompareStatus[]): Q.Promise<any> {
        return new IsContentReadOnlyRequest(contents.map(content => content.getContentId())).sendAndParse().then(
            (readOnlyContentIds: string[]) => {

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
}
