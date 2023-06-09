import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ContentTreeSelectorItem} from './ContentTreeSelectorItem';
import {CompareStatus} from '../content/CompareStatus';
import {PublishStatus} from '../publish/PublishStatus';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class ContentAndStatusTreeSelectorItem
    extends ContentTreeSelectorItem {

    private readonly compareStatus: CompareStatus;

    private readonly publishStatus: PublishStatus;

    constructor(content: ContentSummaryAndCompareStatus, selectable: boolean = true, expandable: boolean = true) {
        super(content.getContentSummary(), selectable, expandable);

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
