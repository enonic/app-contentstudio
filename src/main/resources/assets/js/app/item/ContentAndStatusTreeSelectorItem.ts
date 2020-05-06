import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';
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

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ClassHelper.getClass(this))) {
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
