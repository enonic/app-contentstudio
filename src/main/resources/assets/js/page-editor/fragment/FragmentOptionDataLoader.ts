import '../../api';
import {FragmentOptionDataRequest} from './FragmentOptionDataRequest';
import ContentSummaryOptionDataLoader = api.content.ContentSummaryOptionDataLoader;
import ContentTreeSelectorItem = api.content.resource.ContentTreeSelectorItem;
import FragmentContentSummaryRequest = api.content.resource.FragmentContentSummaryRequest;
import ContentSummary = api.content.ContentSummary;

export class FragmentOptionDataLoader
    extends ContentSummaryOptionDataLoader<ContentTreeSelectorItem> {

    protected request: FragmentOptionDataRequest;

    constructor() {
        super();
    }

    search(value: string): wemQ.Promise<ContentTreeSelectorItem[]> {
        this.notifyLoadingData();

        const req = new FragmentContentSummaryRequest();

        req.setParentSitePath(this.request.getParentSitePath());
        req.setAllowedContentTypes(this.request.getContentTypeNames());
        req.setContentPath(this.request.getContent() ? this.request.getContent().getPath() : null);

        req.setSearchString(value);

        return req.sendAndParse().then((contents: ContentSummary[]) => {

            const result = contents.map(
                content => new ContentTreeSelectorItem(content));

            this.notifyLoadedData(result);
            return result;
        });
    }

    protected createRequest(): FragmentOptionDataRequest {
        return new FragmentOptionDataRequest();
    }

    isPartiallyLoaded(): boolean {
        return this.request.isPartiallyLoaded();
    }

    resetParams() {
        this.request.resetParams();
    }

    setParentSitePath(parentSitePath: string): FragmentOptionDataLoader {
        this.request.setParentSitePath(parentSitePath);
        this.request.setQueryExpr();
        return this;
    }

    setAllowedContentTypes(contentTypes: string[]) {
        throw new Error('Only fragments allowed');
    }

    setAllowedContentTypeNames(contentTypeNames: api.schema.content.ContentTypeName[]) {
        throw new Error('Only fragments allowed');
    }

}
