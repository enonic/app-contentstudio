import Q from 'q';
import {ContentResponse} from './ContentResponse';
import {ListContentByIdRequest} from './ListContentByIdRequest';
import {GetContentByIdRequest} from './GetContentByIdRequest';
import {GetContentSummaryByIds} from './GetContentSummaryByIds';
import {IsContentReadOnlyRequest} from './isContentReadOnlyRequest';
import {Content} from '../content/Content';
import {ContentSummary} from '../content/ContentSummary';
import {ContentId} from '../content/ContentId';
import {ChildOrder} from './order/ChildOrder';

export class ContentSummaryFetcher {

    static fetchChildren(parentContentId: ContentId, from: number = 0, size: number = -1,
                         childOrder?: ChildOrder): Q.Promise<ContentResponse<ContentSummary>> {

        let deferred = Q.defer<ContentResponse<ContentSummary>>();

        new ListContentByIdRequest(parentContentId).setFrom(from).setSize(size).setOrder(childOrder).sendAndParse().then(
            (response: ContentResponse<ContentSummary>) => {
                deferred.resolve(response);
            });

        return deferred.promise;
    }

    static fetch(contentId: ContentId): Q.Promise<Content> {

        let deferred = Q.defer<Content>();

        new GetContentByIdRequest(contentId).sendAndParse().then((content: Content) => {
            deferred.resolve(content);
        });

        return deferred.promise;
    }

    static fetchAndCompareStatus(ids: ContentId[]): Q.Promise<ContentSummary[]> {

        let deferred = Q.defer<ContentSummary[]>();

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
