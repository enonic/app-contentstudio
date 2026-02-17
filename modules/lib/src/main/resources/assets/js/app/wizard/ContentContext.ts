import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class ContentContext {

    private static INSTANCE: ContentContext;

    private content: ContentSummaryAndCompareStatus;

    private constructor() {
        //
    }

    static get(): ContentContext {
        if (!ContentContext.INSTANCE) {
            ContentContext.INSTANCE = new ContentContext();
        }

        return ContentContext.INSTANCE;
    }

    getContent(): ContentSummaryAndCompareStatus {
        return this.content;
    }

    setContent(content: ContentSummaryAndCompareStatus): ContentContext {
        this.content = content;
        return this;
    }
}
