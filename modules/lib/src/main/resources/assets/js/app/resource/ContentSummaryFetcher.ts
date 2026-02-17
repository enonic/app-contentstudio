import Q from 'q';
import {type ContentResponse} from './ContentResponse';
import {ListContentByIdRequest} from './ListContentByIdRequest';
import {GetContentByIdRequest} from './GetContentByIdRequest';
import {GetContentSummaryByIds} from './GetContentSummaryByIds';
import {IsContentReadOnlyRequest} from './isContentReadOnlyRequest';
import {type Content} from '../content/Content';
import {type ContentSummary} from '../content/ContentSummary';
import {type ContentId} from '../content/ContentId';
import {type ChildOrder} from './order/ChildOrder';

export class ContentSummaryFetcher {

    static fetchChildren(parentContentId: ContentId, from: number = 0, size: number = -1,
                         childOrder?: ChildOrder): Q.Promise<ContentResponse<ContentSummary>> {

        const deferred = Q.defer<ContentResponse<ContentSummary>>();

        new ListContentByIdRequest(parentContentId).setFrom(from).setSize(size).setOrder(childOrder).sendAndParse().then(
            (response: ContentResponse<ContentSummary>) => {
                deferred.resolve(response);
            });

        return deferred.promise;
    }

    static fetch(contentId: ContentId): Q.Promise<Content> {

        const deferred = Q.defer<Content>();

        new GetContentByIdRequest(contentId).sendAndParse().then((content: Content) => {
            deferred.resolve(content);
        });

        return deferred.promise;
    }

    static fetchAndCompareStatus(ids: ContentId[]): Q.Promise<ContentSummary[]> {

        const deferred = Q.defer<ContentSummary[]>();

        if (ids.length > 0) {
            new GetContentSummaryByIds(ids).sendAndParse().then((contentSummaries: ContentSummary[]) => {
                deferred.resolve(contentSummaries);
            });
        } else {
            deferred.resolve([]);
        }

        return deferred.promise;
    }

    static getReadOnly(contents: ContentSummary[]): Q.Promise<string[]> {
        return new IsContentReadOnlyRequest(contents.map(content => content.getContentId())).sendAndParse();
    }
}
