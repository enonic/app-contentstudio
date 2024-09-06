import * as Q from 'q';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {GetContentSummaryByIds} from '../../../../resource/GetContentSummaryByIds';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentSummary} from '../../../../content/ContentSummary';
import {ContentId} from '../../../../content/ContentId';

interface RequestToken {
    contentId: ContentId;
    promises: Q.Deferred<ContentSummary>[];
}

export class ImageContentLoader {

    private static requestTokens: RequestToken[] = [];

    private static loadContent: () => void = AppHelper.debounce(ImageContentLoader.doLoadContent, 500);

    static queueContentLoadRequest(contentIds: ContentId[]): Q.Promise<ContentSummary[]> {

        const contentPromises: Q.Promise<ContentSummary>[] = [];

        contentIds.forEach((contentId: ContentId) => {

            const contentPromise = Q.defer<ContentSummary>();
            contentPromises.push(contentPromise.promise);
            const requestToken = ImageContentLoader.requestTokens.filter(token => token.contentId.equals(contentId))[0];
            if (requestToken) {
                requestToken.promises.push(contentPromise);
            } else {
                ImageContentLoader.requestTokens.push({
                    contentId: contentId,
                    promises: [contentPromise]
                });
            }

        });

        const deferred = Q.defer<ContentSummary[]>();
        Q.all(contentPromises).then((contents: ContentSummary[]) => {
            deferred.resolve(contents);
        });

        ImageContentLoader.loadContent();

        return deferred.promise;
    }

    private static doLoadContent() {
        const contentIds: ContentId[] = ImageContentLoader.requestTokens.map(requestToken => requestToken.contentId);
        const requestTokens: RequestToken[] = ImageContentLoader.requestTokens;

        ImageContentLoader.requestTokens = [];

        new GetContentSummaryByIds(contentIds).sendAndParse().then((contents: ContentSummary[]) => {
            requestTokens.forEach((requestToken: RequestToken) => {
                const loadedContent: ContentSummary = contents
                    .find((item: ContentSummary) => item.getContentId().equals(requestToken.contentId));

                requestToken.promises.forEach(promise => promise.resolve(loadedContent));
            });
        }).catch(DefaultErrorHandler.handle);
    }
}
