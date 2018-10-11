import ContentId = api.content.ContentId;
import ContentSummary = api.content.ContentSummary;
import {GetContentSummaryByIds} from '../../../../resource/GetContentSummaryByIds';

type RequestToken = {
    contentId: ContentId;
    promises: wemQ.Deferred<ContentSummary>[];
};

export class ImageContentLoader {

    private static requestTokens: RequestToken[] = [];

    private static loadContent: Function = api.util.AppHelper.debounce(ImageContentLoader.doLoadContent, 500);

    static queueContentLoadRequest(contentIds: ContentId[]): wemQ.Promise<ContentSummary[]> {

        const contentPromises: wemQ.Promise<ContentSummary>[] = [];

        contentIds.forEach((contentId: ContentId) => {

            const contentPromise = wemQ.defer<ContentSummary>();
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

        const deferred = wemQ.defer<ContentSummary[]>();
        wemQ.all(contentPromises).then((contents: ContentSummary[]) => {
            deferred.resolve(contents);
        });

        ImageContentLoader.loadContent();

        return deferred.promise;
    }

    private static doLoadContent() {
        const contentIds = ImageContentLoader.requestTokens.map(requestToken => requestToken.contentId);
        const requestTokens = ImageContentLoader.requestTokens;
        const tokenIds = requestTokens.map(token => token.contentId.toString());

        ImageContentLoader.requestTokens = [];

        new GetContentSummaryByIds(contentIds).sendAndParse().then((contents: ContentSummary[]) => {

            contents.map((content: ContentSummary) => {
                const tokenIndex = tokenIds.indexOf(content.getContentId().toString());
                const requestToken = requestTokens.splice(tokenIndex, 1)[0];
                tokenIds.splice(tokenIndex, 1);

                if (requestToken) {
                    requestToken.promises.map(promise => promise.resolve(content));
                }
            });
        });
    }
}
