import './../../../../../../api.ts';
import ContentTypeName = api.schema.content.ContentTypeName;
import ContentSummaryLoader = api.content.resource.ContentSummaryLoader;
import FragmentContentSummaryRequest = api.content.resource.FragmentContentSummaryRequest;

export class FragmentContentSummaryLoader
    extends ContentSummaryLoader {

    protected request: FragmentContentSummaryRequest;

    constructor() {
        super();
        super.setAllowedContentTypeNames([ContentTypeName.FRAGMENT]);
    }

    protected createRequest(): FragmentContentSummaryRequest {
        return new FragmentContentSummaryRequest();
    }

    setParentSitePath(parentSitePath: string): FragmentContentSummaryLoader {
        (<FragmentContentSummaryRequest>this.getRequest()).setParentSitePath(parentSitePath);
        return this;
    }

    setAllowedContentTypes() {
        throw new Error('Only fragments allowed');
    }

    setAllowedContentTypeNames() {
        throw new Error('Only fragments allowed');
    }
}
