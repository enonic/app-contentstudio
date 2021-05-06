import * as Q from 'q';
import {FragmentOptionDataRequest} from './FragmentOptionDataRequest';
import {FragmentContentSummaryRequest} from '../../app/resource/FragmentContentSummaryRequest';
import {ContentSummaryOptionDataLoader} from '../../app/inputtype/ui/selector/ContentSummaryOptionDataLoader';
import {ContentTreeSelectorItem} from '../../app/item/ContentTreeSelectorItem';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ContentSummary} from '../../app/content/ContentSummary';

export class FragmentOptionDataLoader
    extends ContentSummaryOptionDataLoader<ContentTreeSelectorItem> {

    protected request: FragmentOptionDataRequest;

    constructor() {
        super();
    }

    search(value: string): Q.Promise<ContentTreeSelectorItem[]> {
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
        this.request.setSearchString();
        return this;
    }

    setAllowedContentTypes(contentTypes: string[]) {
        throw new Error('Only fragments allowed');
    }

    setAllowedContentTypeNames(contentTypeNames: ContentTypeName[]) {
        throw new Error('Only fragments allowed');
    }

}
