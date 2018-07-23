import './../../../../../../api.ts';
import {FragmentContentSummaryRequest} from '../../../../../resource/FragmentContentSummaryRequest';
import ContentTypeName = api.schema.content.ContentTypeName;
import ContentSummaryLoader = api.content.resource.ContentSummaryLoader;

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
