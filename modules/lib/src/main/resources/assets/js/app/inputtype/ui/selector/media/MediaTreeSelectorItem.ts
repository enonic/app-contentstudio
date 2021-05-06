import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';
import {MediaSelectorDisplayValue} from './MediaSelectorDisplayValue';
import {ContentTreeSelectorItem} from '../../../../item/ContentTreeSelectorItem';
import {ContentAndStatusTreeSelectorItem} from '../../../../item/ContentAndStatusTreeSelectorItem';
import {CompareStatus} from '../../../../content/CompareStatus';
import {PublishStatus} from '../../../../publish/PublishStatus';
import {ContentSummary} from '../../../../content/ContentSummary';
import {ContentId} from '../../../../content/ContentId';
import {ContentPath} from '../../../../content/ContentPath';

export class MediaTreeSelectorItem
    extends ContentTreeSelectorItem {

    private mediaSelectorDisplayValue: MediaSelectorDisplayValue;

    private compareStatus: CompareStatus;

    private publishStatus: PublishStatus;

    constructor(content: ContentSummary, selectable?: boolean, expandable?: boolean) {
        super(content, selectable, expandable);
        this.mediaSelectorDisplayValue =
            content ? MediaSelectorDisplayValue.fromContentSummary(content) : MediaSelectorDisplayValue.makeEmpty();
    }

    static createMediaTreeSelectorItemWithStatus(item: ContentAndStatusTreeSelectorItem): MediaTreeSelectorItem {
        const mediaTreeSelectorItem = new MediaTreeSelectorItem(item.getContent(), item.isSelectable(), item.isExpandable());

        mediaTreeSelectorItem.compareStatus = item.getCompareStatus();
        mediaTreeSelectorItem.publishStatus = item.getPublishStatus();

        return mediaTreeSelectorItem;
    }

    getPublishStatus(): PublishStatus {
        return this.publishStatus;
    }

    getCompareStatus(): CompareStatus {
        return this.compareStatus;
    }

    setDisplayValue(value: MediaSelectorDisplayValue): MediaTreeSelectorItem {
        this.mediaSelectorDisplayValue = value;
        return this;
    }

    setMissingItemId(value: string): MediaTreeSelectorItem {
        this.mediaSelectorDisplayValue.setMissingItemId(value);
        return this;
    }

    getDisplayValue(): MediaSelectorDisplayValue {
        return this.mediaSelectorDisplayValue;
    }

    getImageUrl(): string {
        return this.mediaSelectorDisplayValue.getImageUrl();
    }

    isEmptyContent(): boolean {
        return this.mediaSelectorDisplayValue.isEmptyContent();
    }

    getContentSummary(): ContentSummary {
        return this.mediaSelectorDisplayValue.getContentSummary();
    }

    getTypeLocaleName(): string {
        return this.mediaSelectorDisplayValue.getTypeLocaleName();
    }

    getId(): string {
        return this.mediaSelectorDisplayValue.getId();
    }

    getContentId(): ContentId {
        return this.mediaSelectorDisplayValue.getContentId();
    }

    getMissingItemId(): string {
        return this.mediaSelectorDisplayValue.getMissingItemId();
    }

    getContentPath(): ContentPath {
        return this.mediaSelectorDisplayValue.getContentPath();
    }

    getPath(): ContentPath {
        return this.mediaSelectorDisplayValue.getPath();
    }

    getDisplayName(): string {
        return this.mediaSelectorDisplayValue.getDisplayName();
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ClassHelper.getClass(this))) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = <MediaTreeSelectorItem>o;

        if (!ObjectHelper.equals(this.mediaSelectorDisplayValue, other.getDisplayValue())) {
            return false;
        }

        return true;
    }
}
