import {FragmentContentSummaryRequest} from '../../../../../resource/FragmentContentSummaryRequest';
import {ContentSummaryLoader} from './ContentSummaryLoader';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';

export class FragmentContentSummaryLoader
    extends ContentSummaryLoader {

    declare protected request: FragmentContentSummaryRequest;

    constructor() {
        super();
        super.setAllowedContentTypeNames([ContentTypeName.FRAGMENT]);
    }

    protected createRequest(): FragmentContentSummaryRequest {
        return new FragmentContentSummaryRequest();
    }

    setParentSitePath(parentSitePath: string): FragmentContentSummaryLoader {
        (this.getRequest() as FragmentContentSummaryRequest).setParentSitePath(parentSitePath);
        return this;
    }

    setAllowedContentTypes() {
        throw new Error('Only fragments allowed');
    }

    setAllowedContentTypeNames() {
        throw new Error('Only fragments allowed');
    }
}
