import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {AccessControlList} from '../access/AccessControlList';
import {BrowseItem} from 'lib-admin-ui/app/browse/BrowseItem';

export class ContentBrowseItem
    extends BrowseItem<ContentSummaryAndCompareStatus> {

    private accessControlList: AccessControlList;

    constructor(model: ContentSummaryAndCompareStatus) {
        super(model);
        this.accessControlList = null;
    }

    getAccessControlList(): AccessControlList {
        return this.accessControlList;
    }

    setAccessControlList(accessControlList: AccessControlList) {
        this.accessControlList = accessControlList;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ContentBrowseItem)) {
            return false;
        }
        let other = <ContentBrowseItem> o;
        return super.equals(o) &&
               ObjectHelper.equals(this.accessControlList, other.getAccessControlList());
    }
}
