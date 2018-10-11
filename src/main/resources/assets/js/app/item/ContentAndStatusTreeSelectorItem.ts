import {ContentTreeSelectorItem} from './ContentTreeSelectorItem';
import {CompareStatus} from '../content/CompareStatus';
import {PublishStatus} from '../publish/PublishStatus';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class ContentAndStatusTreeSelectorItem
    extends ContentTreeSelectorItem {

    private compareStatus: CompareStatus;

    private publishStatus: PublishStatus;

    constructor(content: ContentSummaryAndCompareStatus, expand: boolean) {

        super(content.getContentSummary(), expand);

        this.compareStatus = content.getCompareStatus();
        this.publishStatus = content.getPublishStatus();
    }

    getPublishStatus(): PublishStatus {
        return this.publishStatus;
    }

    getCompareStatus(): CompareStatus {
        return this.compareStatus;
    }

    equals(o: api.Equitable): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, api.ClassHelper.getClass(this))) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = <ContentAndStatusTreeSelectorItem>o;

        if (this.compareStatus !== other.compareStatus) {
            return false;
        }

        if (this.publishStatus !== other.publishStatus) {
            return false;
        }

        return true;
    }
}
